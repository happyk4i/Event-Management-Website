import { Clock, Upload, Check, X, AlertCircle } from 'lucide-react';

type PaymentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected' | 'expired' | 'waived';

const config: Record<PaymentStatus, { label: string; bg: string; text: string; Icon: any }> = {
  pending: { label: 'Pending', bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', Icon: Clock },
  uploaded: { label: 'Uploaded', bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]', Icon: Upload },
  verified: { label: 'Verified', bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', Icon: Check },
  rejected: { label: 'Rejected', bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', Icon: X },
  expired: { label: 'Expired', bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]', Icon: AlertCircle },
  waived: { label: 'Free', bg: 'bg-[#E0E7FF]', text: 'text-[#3730A3]', Icon: Check },
};

export function StatusChip({ status }: { status: string }) {
  const c = config[status as PaymentStatus] || config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-2 border-black ${c.bg} ${c.text} text-xs font-bold uppercase tracking-wider`}
      role="status"
      aria-live="polite"
    >
      <c.Icon size={12} aria-hidden="true" />
      {c.label}
    </span>
  );
}
