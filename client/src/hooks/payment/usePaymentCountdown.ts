import { useEffect, useState } from 'react';

export function usePaymentCountdown(deadline: string | null) {
  const [remaining, setRemaining] = useState<number>(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadline) return;
    const target = new Date(deadline).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        setExpired(true);
      } else {
        setRemaining(Math.floor(diff / 1000));
        setExpired(false);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return { formatted: `${mm}:${ss}`, remaining, expired };
}
