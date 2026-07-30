import { Gift, Tag } from 'lucide-react';
import type { User as UserType } from '../../../types.js';
import { formatRupiah } from '../utils/formatters.js';

type Props = {
  currentUser: UserType;
  userProfile: { coupons: any[]; pointRecords: any[] } | null;
  copyReferralCode: (code: string) => void;
};

export default function CustomerRewardsPanel({ currentUser, userProfile, copyReferralCode }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {}
      <div className="bg-[#B388FF] nb-border p-5 nb-shadow nb-card-hover">
        <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] block mb-2">🎯 Your Referral Code</span>
        <div className="flex items-center space-x-2.5">
          <span className="text-base font-mono font-black text-[#1a1a2e] tracking-wider bg-white nb-border px-3 py-1.5">{currentUser.referralCode}</span>
          <button
            onClick={() => copyReferralCode(currentUser.referralCode)}
            className="nb-btn text-[10px] px-3 py-1 bg-white"
          >
            Copy
          </button>
        </div>
        <p className="text-[10px] text-[#1a1a2e]/70 mt-2 font-semibold">Share & earn IDR 10,000 per signup!</p>
      </div>

      {}
      <div className="bg-[#FFD700] nb-border p-5 nb-shadow nb-card-hover">
        <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] block mb-2">💰 Points Balance</span>
        <div className="flex items-center space-x-2">
          <Gift className="h-5 w-5" />
          <h4 className="text-xl font-black text-[#1a1a2e]">{formatRupiah(currentUser.pointsBalance)}</h4>
        </div>
        <p className="text-[10px] text-[#1a1a2e]/70 mt-2 font-semibold">Points expire 3 months after creation</p>
      </div>

      {}
      <div className="bg-[#7CFC00] nb-border p-5 nb-shadow nb-card-hover">
        <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] block mb-2">🎟️ Active Coupons</span>
        <div className="flex items-center space-x-2">
          <Tag className="h-5 w-5" />
          <span className="text-sm font-black text-[#1a1a2e]">
            {userProfile?.coupons && userProfile.coupons.length > 0
              ? `${userProfile.coupons.length} Coupon(s) (10% OFF)`
              : 'No coupons available'}
          </span>
        </div>
        <p className="text-[10px] text-[#1a1a2e]/70 mt-2 font-semibold">Apply at checkout for extra 10% off</p>
      </div>
    </div>
  );
}
