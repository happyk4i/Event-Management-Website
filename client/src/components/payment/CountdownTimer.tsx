import { Clock } from 'lucide-react';
import { usePaymentCountdown } from '../../hooks/payment/usePaymentCountdown';

interface Props {
  deadline: string | null;
}

export function CountdownTimer({ deadline }: Props) {
  const { formatted, expired } = usePaymentCountdown(deadline);

  if (expired) return null;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      className="bg-[#FEF3C7] border-2 border-black p-3 flex items-center justify-between"
    >
      <span className="text-sm font-bold flex items-center gap-1">
        <Clock size={16} aria-hidden="true" />
        Batas upload
      </span>
      <span className="font-mono font-extrabold text-lg">{formatted}</span>
    </div>
  );
}
