import { useEffect, useState } from 'react';
import type { Booking } from '../types.js';

type Props = { token: string; onToast?: (message: string, type?: 'success' | 'error') => void };

const money = (value: number) => `Rp${Number(value || 0).toLocaleString('id-ID')}`;

export default function PaymentReview({ token, onToast }: Props) {
  const [pending, setPending] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const load = async () => {
    const res = await fetch('/api/bookings/pending-verification', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to load pending bookings');
    setPending(await res.json());
  };

  useEffect(() => { load().catch((e) => onToast?.(e.message, 'error')).finally(() => setLoading(false)); }, [token]);

  const verify = async (bookingId: string, newStatus: 'verified' | 'rejected') => {
    const body = { paymentStatus: newStatus, rejectReason: rejectReasons[bookingId] };
    const res = await fetch(`/api/bookings/${bookingId}/verify`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return onToast?.(data.error || 'Gagal.', 'error');
    onToast?.(`Payment ${newStatus} successfully.`, 'success');
    await load();
  };

  if (loading) return <section className="max-w-6xl mx-auto p-8"><p className="font-black">Loading verification queue...</p></section>;

  return <section className="max-w-6xl mx-auto p-6 md:p-10" id="payment-review">
    <div className="mb-8">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#7CFC00]">Verification hub</p>
      <h2 className="text-4xl font-black text-[#1a1a2e]">Payment Review</h2>
      <p className="mt-2 text-gray-600">{pending.length} booking(s) menunggu review.</p>
    </div>
    {!pending.length && <div className="nb-border bg-white p-8 font-bold">Tidak ada booking yang perlu diverifikasi.</div>}
    <div className="space-y-6">{pending.map((booking) => {
      const items = booking.bookingItems || [];
      const seats = items.reduce((sum, item) => sum + item.quantity, 0);
      return <article key={booking.id} className="nb-border bg-[#FFFEF9] p-5 md:p-7 nb-shadow-sm">
        <div className="flex flex-wrap justify-between gap-4 border-b-2 border-[#1a1a2e] pb-4">
          <div><p className="text-xs font-black uppercase text-gray-500">{booking.event?.name}</p><h3 className="text-xl font-black">Booking #{booking.id.slice(-8).toUpperCase()}</h3></div>
          <span className="nb-border px-3 py-2 text-xs font-black uppercase bg-[#00D4FF]">{booking.paymentStatus}</span>
        </div>
        <div className="grid md:grid-cols-[1fr_300px] gap-6 pt-5">
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div><small className="font-bold text-gray-500">Customer</small><p className="font-black">{booking.user?.name}</p><p className="text-xs text-gray-500">{booking.user?.email}</p></div>
              <div><small className="font-bold text-gray-500">Event</small><p className="font-black">{booking.event?.date} · {booking.event?.time}</p></div>
              <div><small className="font-bold text-gray-500">Tiket</small><p className="font-black">{seats}</p></div>
              <div><small className="font-bold text-gray-500">Total</small><p className="font-black text-[#FF6B9D]">{money(booking.totalPrice)}</p></div>
            </div>
            <div className="nb-border bg-white">
              <div className="grid grid-cols-3 gap-2 bg-[#00D4FF] p-3 text-xs font-black uppercase"><span>Ticket type</span><span>Qty</span><span>Subtotal</span></div>
              {items.map((item) => <div key={item.id} className="grid grid-cols-3 gap-2 border-t-2 border-[#1a1a2e] p-3 text-sm"><span className="font-bold">{item.ticketType?.name || 'Ticket'}</span><span>{item.quantity}</span><span>{money(Number(item.subtotal))}</span></div>)}
            </div>
          </div>
          <aside>
            {booking.paymentProofUrl && <div className="mb-4"><p className="font-black text-sm mb-2">Payment Proof</p><a href={booking.paymentProofUrl} target="_blank" rel="noreferrer"><img src={booking.paymentProofUrl} alt="payment proof" className="nb-border w-full max-h-48 object-contain bg-black" /></a></div>}
            <textarea id={`reason-${booking.id}`} placeholder="Alasan penolakan (opsional)" className="nb-border w-full p-2 text-xs mb-3" rows={2} value={rejectReasons[booking.id] || ''} onChange={(e) => setRejectReasons({ ...rejectReasons, [booking.id]: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <button id={`verify-${booking.id}`} className="nb-btn bg-[#7CFC00] px-3 py-3 text-xs font-black uppercase" onClick={() => verify(booking.id, 'verified')}>Approve</button>
              <button id={`reject-${booking.id}`} className="nb-btn bg-[#FF6B9D] px-3 py-3 text-xs font-black uppercase" onClick={() => verify(booking.id, 'rejected')}>Reject</button>
            </div>
          </aside>
        </div>
      </article>;
    })}</div>
  </section>;
}
