import { useState, useEffect } from 'react';
import { BookingCard } from '../../payment/BookingCard'; // Changed from ../../components/payment/BookingCard

interface CustomerBookingsProps {
  authToken: string | null;
  userId: string | null;
}

export function CustomerBookings({ authToken, userId }: CustomerBookingsProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  const fetchBookings = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/my', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch {  } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [authToken]);

  const handleUpload = async (bookingId: string, file: File) => {
    if (!authToken) return;
    setUploading(bookingId);
    try {
      const fd = new FormData();
      fd.append('paymentProof', file);
      const res = await fetch(`/api/bookings/${bookingId}/upload-proof`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        fetchBookings();
      } else {
        alert(data.error || 'Upload gagal.');
      }
    } catch {
      alert('Gagal mengupload bukti.');
    } finally {
      setUploading(null);
    }
  };

  const tabs = ['All', 'Pending', 'Uploaded', 'Verified', 'Expired', 'Rejected'];
  const filtered = filter === 'All' ? bookings : bookings.filter((b: any) => b.paymentStatus === filter.toLowerCase());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#1A1A2E]">Pembayaran Saya</h1>
        <p className="text-[#6B7280] mt-1">Kelola bukti pembayaran untuk event yang diikuti.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter status pembayaran">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={filter === t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 text-xs font-bold border-2 border-black transition-all
              ${filter === t ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border-4 border-black p-6 animate-pulse">
              <div className="h-5 bg-gray-200 w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 w-1/2 mb-2" />
              <div className="h-12 bg-gray-200 w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-4 border-dashed border-black bg-white">
          <p className="text-lg font-bold text-[#6B7280]">Belum ada pembayaran</p>
          <p className="text-sm text-[#6B7280] mt-1">Booking event untuk mulai.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {filtered.map((b: any) => (
            <BookingCard key={b.id} booking={b} onUpload={handleUpload} uploading={uploading === b.id} />
          ))}
        </div>
      )}
    </div>
  );
}
