import { Router, Request, Response } from 'express';
import { generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { findChatEvents, ChatEvent } from '../neon.js';

const openrouter = createOpenAICompatible({
  name: 'openrouter',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  headers: { 'HTTP-Referer': 'https://eventkuy.app', 'X-Title': 'Event Kuy' },
});

export const chatRouter = Router();

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const systemPrompt = (events: ChatEvent[]) => `
Anda adalah asisten virtual Event Kuy yang ramah, solutif, dan singkat.
Tugas Anda membantu pengguna menemukan event yang cocok.

Kumpulkan empat preferensi secara bertahap: kategori event, lokasi kota, jadwal/tanggal,
dan anggaran biaya. Tanyakan hanya informasi yang masih belum diketahui.

ATURAN DATA:
- Anda hanya boleh merekomendasikan event pada DATA EVENT TERSEDIA di bawah.
- Jangan mengarang nama, harga, tanggal, lokasi, status, atau ketersediaan event.
- Jika DATA EVENT TERSEDIA kosong, katakan event yang cocok belum ditemukan dan tawarkan
  pengguna untuk mengubah preferensi kategori, kota, tanggal, atau anggaran.
- Jawaban harus dalam Bahasa Indonesia, langsung ke inti, dengan poin-poin.
- Untuk setiap rekomendasi sebutkan nama, lokasi, tanggal, dan harga.

DATA EVENT TERSEDIA:
${JSON.stringify(events, null, 2)}
`;

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const cleanMessages = messages
      .filter((message: ChatMessage) =>
        (message?.role === 'user' || message?.role === 'assistant') &&
        typeof message.content === 'string' && message.content.trim(),
      )
      .slice(-10)
      .map((message: ChatMessage) => ({ role: message.role, content: message.content.slice(0, 1200) }));

    const latestUserMessage = [...cleanMessages].reverse().find((message) => message.role === 'user');
    if (!latestUserMessage) {
      res.status(400).json({ error: 'Pesan pengguna wajib diisi.' });
      return;
    }

    // Call Activepieces automation webhook
    const activepiecesWebhookUrl = 'https://cloud.activepieces.com/api/v1/webhooks/wwJvcE9OLekCzbpBIvbEt';
    try {
      const response = await fetch(activepiecesWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: latestUserMessage.content,
          messages: cleanMessages
        })
      });

      if (response.ok) {
        const text = await response.text();
        let message = text;
        let activepiecesEvents: ChatEvent[] = [];

        try {
          const data = JSON.parse(text);
          if (data && typeof data === 'object') {
            message = data.message || data.text || data.content || data.response || text;
            if (Array.isArray(data.events)) {
              activepiecesEvents = data.events;
            }
          }
        } catch (e) {
          // If response is not JSON, it's fine, we treat the raw text as the message.
        }

        res.json({ message, events: activepiecesEvents });
        return;
      } else {
        console.warn(`[Chat] Activepieces webhook returned status ${response.status}. Falling back to local AI agent.`);
      }
    } catch (err) {
      console.warn('[Chat] Activepieces webhook call failed. Falling back to local AI agent:', err);
    }

    // Local fallback
    const events = await findChatEvents(latestUserMessage.content);
    const result = await generateText({
      model: openrouter(process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'),
      system: systemPrompt(events),
      messages: cleanMessages,
      temperature: 0.3,
    });

    res.json({ message: result.text, events });
  } catch (error) {
    console.error('[Chat] Failed:', error);
    res.status(500).json({ error: 'Chatbot sedang tidak tersedia. Periksa konfigurasi database dan OpenAI.' });
  }
});
