import { useState, useEffect } from 'react';
import { StatusChip } from '../../payment/StatusChip'; // Changed from ../../components/payment/StatusChip
import { ProofPreview } from '../../payment/ProofPreview'; // Changed from ../../components/payment/ProofPreview
import { RejectReasonModal } from '../../payment/RejectReasonModal'; // Changed from ../../components/payment/RejectReasonModal

interface PaymentReviewProps {
  authToken: string | null;
  userId: string | null;
  role: string | null;
}

export function PaymentReview({ authToken }: PaymentReviewProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const fetchPending = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/pending-verification', {
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

  useEffect(() => { fetchPending(); }, [authToken]);

  const handleApprove = async (bookingId: string) => {
    if (!authToken) return;
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ paymentStatus: 'verified' }),
      });
      if (res.ok) fetchPending();
    } catch {  } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason: string | null) => {
    if (!authToken || !rejectTarget) return;
    setActionLoading(rejectTarget);
    setRejectTarget(null);
    try {
      const res = await fetch(`/api/bookings/${rejectTarget}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ paymentStatus: 'rejected', rejectReason: reason }),
      });
      if (res.ok) fetchPending();
    } catch {  } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#1A1A2E]">Review Pembayaran</h1>
        <p className="text-[#6B7280] mt-1">Verifikasi bukti pembayaran pelanggan.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border-4 border-black p-6 animate-pulse">
              <div className="h-5 bg-gray-200 w-1/4 mb-3" />
              <div className="h-4 bg-gray-200 w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 w-2/3 mb-4" />
              <div className="h-16 bg-gray-200 w-full" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 border-4 border-dashed border-black bg-white">
          <p className="text-lg font-bold text-[#6B7280]">Tidak ada pembayaran yang menunggu</p>
          <p className="text-sm text-[#6B7280] mt-1">Semua pembayaran sudah diverifikasi.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="bg-white border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Buyer & event details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold">{b.user?.name || '—'}</span>
                    <span className="text-sm text-[#6B7280]">{b.user?.email}</span>
                  </div>
                  <p className="font-bold text-lg truncate">{b.event?.name}</p>
                  <p className="text-sm text-[#6B7280]">{b.event?.date} • {b.event?.time}</p>
                  <p className="font-extrabold">Rp {b.totalPrice?.toLocaleString?.('id-ID') || Number(b.totalPrice).toLocaleString('id-ID')}</p>
                  <StatusChip status={b.paymentStatus} />
                </div>

                {/* Proof preview */}
                <div className="flex flex-col items-center gap-2">
                  <ProofPreview url={b.paymentProofUrl} alt={`Bukti pembayaran dari ${b.user?.name}`} />
                  <span className="text-xs text-[#6B7280]">{b.bookingItems?.length || 1} tiket</span>
                </div>
              </div>

              {/* Approve / Reject */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t-2 border-black/10">
                <button
                  onClick={() => setRejectTarget(b.id)}
                  disabled={actionLoading === b.id}
                  className="px-4 py-2 bg-[#FF4757] text-white border-2 border-black font-bold text-sm
                    hover:translate-x-0.5 hover:translate-y-0.5 transition-transform disabled:opacity-50"
                >
                  {actionLoading === b.id ? '...' : 'Tolak'}
                </button>
                <button
                  onClick={() => handleApprove(b.id)}
                  disabled={actionLoading === b.id}
                  className="px-4 py-2 bg-[#10B981] text-white border-2 border-black font-bold text-sm
                    hover:translate-x-0.5 hover:translate-y-0.5 transition-transform disabled:opacity-50"
                >
                  {actionLoading === b.id ? '...' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RejectReasonModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onSubmit={handleReject}
      />
    </div>
  );
}
