import React from 'react';
import { Zap, Ticket, Crown } from 'lucide-react';

export default function TopMarquee() {
  return (
    <div className="bg-[#1a1a2e] text-[#FFD700] py-2.5 overflow-hidden border-b-4 border-[#FFD700]">
      <div className="animate-marquee whitespace-nowrap flex items-center space-x-8 text-xs font-black uppercase tracking-widest">
        {[...Array(3)].map((_, i) => (
          <React.Fragment key={i}>
            <span className="flex items-center space-x-2"><Zap className="h-3.5 w-3.5" /><span>Indonesian Premium Event Platform</span></span>
            <span></span>
            <span className="flex items-center space-x-2"><Ticket className="h-3.5 w-3.5" /><span>Secure Ticketing System</span></span>
            <span></span>
            <span className="flex items-center space-x-2"><Crown className="h-3.5 w-3.5" /><span>Referral Rewards Active</span></span>
            <span></span>
            <span></span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
