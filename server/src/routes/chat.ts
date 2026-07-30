import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.ts';

export const chatRouter = Router();

type ChatMessage = { role: 'user' | 'assistant'; content: string };

async function searchEvents(userMessage: string) {
  const term = userMessage.trim().slice(0, 200);
  const lower = term.toLowerCase();

  const catIndo: Record<string, string> = {
    musik: 'Music', konser: 'Music', band: 'Music',
    teknologi: 'Technology', tech: 'Technology', developer: 'Technology',
    seni: 'Arts & Crafts', batik: 'Arts & Crafts', wayang: 'Arts & Crafts', lukisan: 'Arts & Crafts',
    kuliner: 'Food & Culinary', makanan: 'Food & Culinary', makan: 'Food & Culinary', kopi: 'Food & Culinary', food: 'Food & Culinary',
    workshop: 'Workshop', kelas: 'Workshop', belajar: 'Workshop',
    olahraga: 'Sports', lari: 'Sports', marathon: 'Sports', yoga: 'Sports', triathlon: 'Sports',
  };
  const catHints: string[] = [];
  for (const [kata, cat] of Object.entries(catIndo)) {
    if (lower.includes(kata) && !catHints.includes(cat)) catHints.push(cat);
  }
  for (const cat of ['Music', 'Technology', 'Arts & Crafts', 'Food & Culinary', 'Workshop', 'Sports']) {
    if (lower.includes(cat.toLowerCase()) && !catHints.includes(cat)) catHints.push(cat);
  }

  const cityMap: Record<string, string[]> = {
    jakarta: ['Jakarta', 'Tangerang', 'Kuningan', 'SCBD', 'Kemayoran', 'Gelora'],
    bandung: ['Bandung', 'ITB', 'Gasibu'],
    surabaya: ['Surabaya', 'Tunjungan'],
    bali: ['Bali', 'Ubud', 'Gianyar', 'Jimbaran', 'Seminyak'],
    solo: ['Solo', 'Vastenburg'],
    yogyakarta: ['Yogyakarta', 'Jogja', 'Magelang', 'Borobudur'],
    pekalongan: ['Pekalongan'],
  };
  const locTerms: string[] = [];
  for (const [key, vals] of Object.entries(cityMap)) {
    if (lower.includes(key)) locTerms.push(...vals);
  }

  let maxPrice: number | undefined;
  const priceMatch = term.match(/(?:di bawah|kurang dari|under|max|maksimal?)\s*([\d.,]+)/i);
  if (priceMatch) maxPrice = parseInt(priceMatch[1].replace(/\./g, ''), 10);
  if (lower.includes('gratis') || lower.includes('free')) maxPrice = 0;

  const where: any = { status: 'Active', availableSeats: { gt: 0 } };

  if (catHints.length > 0) where.category = { in: catHints };
  if (locTerms.length > 0) {
    where.OR = locTerms.map(loc => ({ location: { contains: loc, mode: 'insensitive' as const } }));
  }
  if (maxPrice !== undefined) where.price = { lte: maxPrice };

  const stopWords = new Set(['cari', 'event', 'yang', 'di', 'dan', 'atau', 'saya', 'mau', 'ada', 'untuk', 'ini', 'itu', 'tolong']);
  const words = term.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  if (words.length > 0) {
    const textOR = words.flatMap(w => [
      { name: { contains: w, mode: 'insensitive' as const } },
      { description: { contains: w, mode: 'insensitive' as const } },
      { location: { contains: w, mode: 'insensitive' as const } },
    ]);
    if (where.OR && where.OR.length > 0) {
      where.AND = where.OR.map(() => ({ OR: textOR }));
    } else {
      where.OR = textOR;
    }
  }

  return prisma.event.findMany({
    where, orderBy: [{ date: 'asc' }], take: 8,
    select: { id: true, name: true, category: true, price: true, date: true, time: true, location: true, description: true, availableSeats: true, status: true, code: true },
  });
}

chatRouter.post('/', async (_req: Request, res: Response) => {
  try {
    const messages = Array.isArray(_req.body?.messages) ? _req.body.messages : [];
    const valid = messages.filter((m: ChatMessage) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim()).slice(-10);
    const last = [...valid].reverse().find(m => m.role === 'user');
    if (!last) return res.status(400).json({ error: 'Pesan pengguna wajib diisi.' });

    const events = await searchEvents(last.content);
    const msg = events.length === 0
      ? 'Maaf, tidak ada event yang cocok. Coba kata kunci lain!'
      : buatRespon(events);

    res.json({ message: msg, events });
  } catch {
    res.status(500).json({ error: 'Chatbot sedang tidak tersedia. Coba lagi nanti.' });
  }
});

function buatRespon(events: any[]): string {
  const cat = events[0]?.category;
  const label: Record<string, string> = { Music: '🎵 musik', Technology: '💻 teknologi', 'Arts & Crafts': '🎨 seni', 'Food & Culinary': '🍜 kuliner', Workshop: '📚 workshop', Sports: '🏆 olahraga' };
  const saran: Record<string, string> = { Music: '\n\n🎵 Coba juga "event musik di Bandung"!', Technology: '\n\n💻 Ada "startup weekend" juga!', 'Arts & Crafts': '\n\n🎨 Coba "batik pekalongan"!', 'Food & Culinary': '\n\n🍜 Cari "coffee festival"!', Workshop: '\n\n📚 Ada "UI/UX masterclass"!', Sports: '\n\n🏃 Coba "triathlon bali"!' };

  const head = events.length === 1
    ? 'Saya menemukan 1 event:'
    : `Saya temukan ${events.length} event ${label[cat] || ''}:`;

  const body = events.slice(0, 5).map((e, i) => {
    const price = e.price === 0 ? 'GRATIS' : 'Rp ' + e.price.toLocaleString('id-ID');
    return i + 1 + '. **' + e.name + '** — ' + e.location + ' — ' + new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' — ' + price;
  }).join('\n');

  return head + '\n\n' + body + (saran[cat] || '');
}
