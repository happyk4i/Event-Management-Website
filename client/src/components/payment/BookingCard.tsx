import { Ticket, Calendar, MapPin } from 'lucide-react';
import { StatusChip } from './StatusChip';
import { CountdownTimer } from './CountdownTimer';
import { DragDropUpload } from './DragDropUpload';

interface Booking {
  id: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentDeadline: string | null;
  bookedAt: string;
  rejectReason?: string | null;
  event: {
    name: string;
    date: string;
    time: string;
    location: string;
    price: number;
  };
  bookingItems?: { ticketType: { name: string }; quantity: number; pricePerItem: number }[];
}

interface BookingCardProps {
  booking: Booking;
  onUpload: (bookingId: string, file: File) => void;
  uploading?: boolean;
}

export function BookingCard({ booking, onUpload, uploading }: BookingCardProps) {
  const isPending = booking.paymentStatus === 'pending';
  const isExpired = booking.paymentStatus === 'expired';
  const isRejected = booking.paymentStatus === 'rejected';
  const isUploaded = booking.paymentStatus === 'uploaded';
  const isVerified = booking.paymentStatus === 'verified';
  const isWaived = booking.paymentStatus === 'waived';
  const showUpload = isPending && !isExpired;

  return (
    <article className="bg-white border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] p-4 sm:p-6 space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold text-[#1A1A2E] truncate">{booking.event.name}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Calendar size={14} aria-hidden="true" /> {booking.event.date}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} aria-hidden="true" className="shrink-0" /> {booking.event.location}
            </span>
          </div>
        </div>
        <StatusChip status={booking.paymentStatus} />
      </header>

      <dl className="grid grid-cols-2 gap-2 text-sm border-y-2 border-black/10 py-3">
        <div>
          <dt className="text-[#6B7280] font-bold text-xs uppercase tracking-wider">Total</dt>
          <dd className="font-extrabold text-lg">Rp {(booking.totalPrice ?? 0).toLocaleString('id-ID')}</dd>
        </div>
        <div>
          <dt className="text-[#6B7280] font-bold text-xs uppercase tracking-wider">Tiket</dt>
          <dd className="flex items-center gap-1 font-bold">
            <Ticket size={14} aria-hidden="true" />
            {booking.bookingItems?.reduce((s, i) => s + i.quantity, 0) ?? 1}
          </dd>
        </div>
      </dl>

      {isPending && <CountdownTimer deadline={booking.paymentDeadline} />}

      {isExpired && (
        <div role="alert" className="bg-[#FEE2E2] border-2 border-[#DC2626] p-3 text-sm font-bold">
          Batas upload terlewati. Booking dibatalkan otomatis.
        </div>
      )}

      {isRejected && booking.rejectReason && (
        <div role="alert" className="bg-[#FEE2E2] border-2 border-[#DC2626] p-3 text-sm">
          <span className="font-bold">Ditolak:</span> {booking.rejectReason}
        </div>
      )}

      {isUploaded && (
        <div role="status" className="bg-[#DBEAFE] border-2 border-[#1E40AF] p-3 text-sm font-bold">
          Bukti terupload — menunggu verifikasi organizer.
        </div>
      )}

      {isVerified && (
        <div role="status" className="bg-[#D1FAE5] border-2 border-[#065F46] p-3 text-sm font-bold">
          Pembayaran diverifikasi. Tiket Anda aktif!
        </div>
      )}

      {isWaived && (
        <div role="status" className="bg-[#E0E7FF] border-2 border-[#3730A3] p-3 text-sm font-bold">
          Event gratis — tidak perlu pembayaran.
        </div>
      )}

      {showUpload && (
        <DragDropUpload
          onFile={(file) => {
            if (file) onUpload(booking.id, file);
          }}
          disabled={uploading}
        />
      )}
    </article>
  );
}
