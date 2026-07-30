import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Calendar, Loader2, MapPin, Send, Sparkles, Ticket, Trash2, Tag } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };
type Event = { id: string; name: string; category: string; price: number; date: string; time: string; location: string; description: string; availableSeats: number; code: string };

const welcome: Message = { role: 'assistant', content: 'Halo! Saya asisten **Event Kuy** 🎫\n\nKetik apa yang kamu cari, misalnya:\n• "Cari event musik di Jakarta"\n• "Workshop di bawah 300 ribu"\n• "Food festival di Bali"\n• "Event teknologi minggu ini"' };
const rupiah = (price: number) => `Rp ${new Intl.NumberFormat('id-ID').format(price)}`;

export default function EventChat({ onClose }: { onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [events, setEvents] = useState<Event[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next); setInput(''); setEvents([]); setError(''); setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menghubungi chatbot.');
      setMessages((current) => [...current, { role: 'assistant', content: data.message }]);
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); }
  }

  const categoryColors: Record<string, string> = {
    Music: '#B388FF', Technology: '#00D4FF', 'Arts & Crafts': '#FF6B9D',
    'Food & Culinary': '#FFD700', Workshop: '#7CFC00', Sports: '#FF8C42'
  };

  return (
    <section className="chatbot-container" aria-label="Chatbot rekomendasi Event Kuy">
      <header className="chatbot-header">
        <div className="flex items-center gap-3">
          <span className="chatbot-logo"><Ticket size={19} /></span>
          <div><h2>Event Kuy Assistant</h2><p><i /> Online</p></div>
        </div>
        <div className="flex gap-1">
          <button className="chatbot-icon-btn" onClick={() => { setMessages([welcome]); setEvents([]); setError(''); }} aria-label="Hapus percakapan"><Trash2 size={16} /></button>
          {onClose && <button className="chatbot-icon-btn" onClick={onClose} aria-label="Tutup chatbot">×</button>}
        </div>
      </header>

      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div className={`chatbot-message ${message.role}`} key={index}>
            <div className={`chatbot-bubble ${message.role}`}>
              {message.role === 'assistant' && <span className="chatbot-avatar"><Sparkles size={14} /></span>}
              <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
            </div>
          </div>
        ))}

        {}
        {events.length > 0 && (
          <div className="chatbot-event-grid">
            {events.map((event) => (
              <article key={event.id} className="chatbot-event-card">
                <span
                  className="chatbot-event-cat"
                  style={{ backgroundColor: categoryColors[event.category] || '#888', color: '#1a1a2e' }}
                >
                  {event.category}
                </span>
                <h3>{event.name}</h3>
                <p className="chatbot-event-loc"><MapPin size={12} /> {event.location}</p>
                <p className="chatbot-event-date">
                  <Calendar size={12} /> {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {event.time}
                </p>
                <div className="chatbot-event-footer">
                  <strong>{event.price === 0 ? '🎉 GRATIS' : rupiah(event.price)}</strong>
                  <span className={`chatbot-seat ${event.availableSeats < 15 ? 'low' : 'avail'}`}>
                    {event.availableSeats} kursi
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {loading && (
          <div className="chatbot-message assistant">
            <div className="chatbot-bubble assistant">
              <span className="chatbot-avatar"><Sparkles size={14} /></span>
              <Loader2 className="animate-spin" size={16} />
              <p>Mencari event yang cocok...</p>
            </div>
          </div>
        )}

        {error && <p className="chatbot-error"> {error}</p>}
        <div ref={end} />
      </div>

      {}
      {messages.length === 1 && (
        <div className="chatbot-suggestions">
          {['Cari event musik di Jakarta', 'Food event di bawah 500 ribu', 'Workshop di Bandung', 'Event gratis'].map((prompt) => (
            <button key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>
          ))}
        </div>
      )}

      <form className="chatbot-input-area" onSubmit={send}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={keyDown}
          rows={1}
          maxLength={500}
          placeholder="Cari event... (contoh: workshop di Bandung)"
          aria-label="Pesan untuk Event Kuy Assistant"
        />
        <button type="submit" disabled={!input.trim() || loading} aria-label="Kirim pesan">
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}
