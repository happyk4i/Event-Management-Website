import { useEffect, useState } from 'react';
import type { Booking } from '../../../types.js';

type Props = { token: string; onToast?: (message: string, type?: 'success' | 'error') => void };

const money = (value: number) => `Rp${Number(value || 0).toLocaleString('id-ID')}`;

export default function CustomerBookings({ token, onToast }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await fetch('/api/bookings/my', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('Failed to load bookings');
    setBookings(await response.json());
  };

  useEffect(() => {
    load().catch((e) => onToast?.(e.message, 'error')).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const upload = async (bookingId: string) => {
    const file = selectedFiles[bookingId];
    if (!file) return onToast?.('Pilih file bukti pembayaran terlebih dahulu.', 'error');
    const body = new FormData();
    body.append('paymentProof', file);
    const response = await fetch(`/api/bookings/${bookingId}/upload-proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    const data = await response.json();
    if (!response.ok) return onToast?.(data.error || 'Upload gagal.', 'error');
    onToast?.('Bukti pembayaran berhasil dikirim.', 'success');
    await load();
  };

  if (loading) return <section className="max-w-6xl mx-auto p-8"><p className="font-black">Memuat booking...</p></section>;

  return <section className="max-w-6xl mx-auto p-6 md:p-10" id="customer-bookings">
    <div className="mb-8">
      <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF6B9D]">Payment center</p>
      <h2 className="text-4xl font-black text-[#1a1a2e]">My Bookings</h2>
      <p className="mt-2 text-gray-600">Kelola pembayaran, bukti transfer, dan e-ticket kamu.</p>
    </div>
    {!bookings.length && <div className="nb-border bg-white p-8 font-bold">Belum ada booking.</div>}
    <div className="space-y-6">{bookings.map((booking) => {
      const items = booking.bookingItems || [];
      const seats = items.reduce((sum, item) => sum + item.quantity, 0);
      const deadline = new Date(new Date(booking.bookedAt).getTime() + 30 * 60 * 1000).getTime();
      const remaining = Math.max(0, deadline - now);
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      const pending = booking.status === 'pending' && booking.paymentStatus === 'pending' && remaining > 0;
      const confirmed = booking.status === 'confirmed' && ['verified', 'waived'].includes(booking.paymentStatus);

      return <article key={booking.id} className="nb-border bg-[#FFFEF9] p-5 md:p-7 nb-shadow-sm">
        <div className="flex flex-wrap justify-between gap-4 border-b-2 border-[#1a1a2e] pb-4">
          <div><p className="text-xs font-black uppercase text-gray-500">{booking.event?.name}</p><h3 className="text-xl font-black">Booking #{booking.id.slice(-8).toUpperCase()}</h3></div>
          <span className="nb-border px-3 py-2 text-xs font-black uppercase bg-white">{confirmed ? (booking.paymentStatus === 'waived' ? 'Confirmed · Free' : 'Lunas / Terverifikasi') : `${booking.status} · ${booking.paymentStatus}`}</span>
        </div>
        <div className="grid md:grid-cols-[1fr_280px] gap-6 pt-5">
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div><small className="font-bold text-gray-500">Event</small><p className="font-black">{booking.event?.date} · {booking.event?.time}</p></div>
              <div><small className="font-bold text-gray-500">Lokasi</small><p className="font-black">{booking.event?.location}</p></div>
              <div><small className="font-bold text-gray-500">Total tiket</small><p className="font-black">{seats}</p></div>
              <div><small className="font-bold text-gray-500">Total</small><p className="font-black text-[#FF6B9D]">{money(booking.totalPrice)}</p></div>
            </div>
            <div className="nb-border bg-white">
              <div className="grid grid-cols-4 gap-2 bg-[#FFD700] p-3 text-xs font-black uppercase"><span>Ticket type</span><span>Qty</span><span>Subtotal</span><span>Price</span></div>
              {items.map((item) => <div key={item.id} className="grid grid-cols-4 gap-2 border-t-2 border-[#1a1a2e] p-3 text-sm"><span className="font-bold">{item.ticketType?.name || 'Ticket'}</span><span>{item.quantity}</span><span>{money(Number(item.subtotal))}</span><span>{money(Number(item.pricePerItem))}</span></div>)}
            </div>
            {confirmed && <div className="mt-5 nb-border bg-[#7CFC00] p-5"><div className="flex flex-wrap items-center gap-5"><div className="bg-white p-2 nb-border text-center"><div className="grid grid-cols-5 gap-1 w-24 h-24">{Array.from({ length: 25 }, (_, i) => <i key={i} className={(booking.id.charCodeAt(i % booking.id.length) + i) % 3 ? 'bg-[#1a1a2e]' : 'bg-white'} />)}</div><small className="font-black text-[9px]">SCAN E-TICKET</small></div><div><p className="font-black text-2xl">E-TICKET</p><p className="font-bold">#{booking.id.toUpperCase()}</p><p className="mt-2 text-sm">Booked: {new Date(booking.bookedAt).toLocaleString('id-ID')}<br />Verified: {booking.verifiedAt ? new Date(booking.verifiedAt).toLocaleString('id-ID') : 'Free booking'}</p></div></div></div>}
          </div>
          <aside>
            {pending && <div className="nb-border bg-[#FFD700] p-5"><h4 className="font-black text-lg">Instruksi Pembayaran</h4><p className="mt-3 text-sm font-bold">Transfer ke BCA<br /><strong className="text-lg">8832-0922-11</strong><br />a/n PT Event Kuy Indonesia</p><p className="mt-3 text-sm">Nominal: <strong>{money(booking.totalPrice)}</strong><br />Kode booking: <strong>{booking.id}</strong></p><p className="mt-4 border-t-2 border-[#1a1a2e] pt-3 text-2xl font-black">{mins}:{String(secs).padStart(2, '0')}</p><p className="text-xs font-bold">Upload JPEG, PNG, atau WebP maksimal 5 MB.</p><input id={`proof-${booking.id}`} type="file" accept="image/jpeg,image/png,image/webp" className="mt-3 w-full text-xs" onChange={(e) => e.target.files?.[0] && setSelectedFiles({ ...selectedFiles, [booking.id]: e.target.files[0] })} /><button id={`upload-${booking.id}`} className="nb-btn mt-3 w-full bg-[#FF6B9D] px-4 py-3 text-xs font-black uppercase" onClick={() => upload(booking.id)}>Upload Bukti</button></div>}
            {booking.paymentStatus === 'uploaded' && <div className="nb-border bg-[#00D4FF] p-5 font-black">Bukti diterima. Menunggu review organizer.</div>}
            {booking.paymentStatus === 'rejected' && <div className="nb-border bg-[#FF6B9D] p-5 font-bold">Bukti ditolak.<br />{booking.rejectReason || 'Silakan buat booking baru.'}</div>}
            {booking.paymentStatus === 'expired' && <div className="nb-border bg-gray-200 p-5 font-bold">Booking expired dan kursi telah dikembalikan.</div>}
          </aside>
        </div>
      </article>;
    })}</div>
  </section>;
}
