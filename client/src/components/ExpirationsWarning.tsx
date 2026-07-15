import React from 'react';
import { AlertCircle } from 'lucide-react';

type ExpirationsWarningProps = {
  userProfile: { pointRecords: any[]; coupons: any[] } | null;
};

export default function ExpirationsWarning({ userProfile }: ExpirationsWarningProps) {
  if (!userProfile) return null;
  const today = new Date();

  // Check points records that will expire within the next 30 days
  const closeToExpirePoints = userProfile.pointRecords.filter((r: { isUsed: any; expiryDate: string | number | Date; }) => {
    if (r.isUsed) return false;
    const expDate = new Date(r.expiryDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  });

  // Check coupons that will expire within the next 30 days
  const closeToExpireCoupons = userProfile.coupons.filter((c: { isUsed: any; expiryDate: string | number | Date; }) => {
    if (c.isUsed) return false;
    const expDate = new Date(c.expiryDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  });

  if (closeToExpirePoints.length === 0 && closeToExpireCoupons.length === 0) return null;

  return (
    <div className="bg-[#FFD700] nb-border p-4 mb-4 text-xs text-[#1a1a2e] flex items-start space-x-3 nb-shadow-sm animate-shake-hover">
      <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
      <div className="space-y-1">
        <p className="font-black uppercase tracking-wider text-[11px]">⚡ EXPIRATION ALERT!</p>
        {closeToExpirePoints.map((p: { id: any; amount: number; expiryDate: any; }) => (
          <p key={p.id}>• {p.amount} reward points expire on <strong>{p.expiryDate}</strong></p>
        ))}
        {closeToExpireCoupons.map((c: { id: any; code: any; expiryDate: any; }) => (
          <p key={c.id}>• 10% welcome coupon [<strong>{c.code}</strong>] expires on <strong>{c.expiryDate}</strong></p>
        ))}
      </div>
    </div>
  );
}
