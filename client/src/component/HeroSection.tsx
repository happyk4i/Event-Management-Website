import React, { Suspense } from 'react';
import { Flame, Gift, Users } from 'lucide-react';

const Scene3D = React.lazy(() => import('../Scene3D.js'));

type Props = {
  totalCount: number;
};

export default function HeroSection({ totalCount }: Props) {
  return (
    <div className="relative overflow-hidden bg-[#1a1a2e] border-b-4 border-[#FFD700]" style={{ minHeight: '340px' }}>
      {/* 3D Canvas Background */}
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>

      {/* Hero Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="animate-slide-up">
          <span className="inline-block bg-[#FFD700] text-[#1a1a2e] nb-border px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-6 nb-shadow-sm rotate-[-1deg]">
            🎫 Platform Event #1 Indonesia
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
            Discover <span className="text-[#FFD700] animate-glitch">Epic Events</span>
            <br />
            <span className="text-[#FF6B9D]">Near You</span> 🔥
          </h2>
          <p className="mt-4 text-base text-gray-300 max-w-xl mx-auto font-medium">
            Temukan event musik, tech, food, workshop terbaik di Indonesia.
            Book tiket, dapatkan diskon, dan nikmati pengalaman yang unforgettable!
          </p>
        </div>

        {/* Floating stat pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-[#FFD700] nb-border px-4 py-2 text-[#1a1a2e] text-sm font-black flex items-center space-x-2 nb-shadow-sm animate-float">
            <Flame className="h-4 w-4" />
            <span>{totalCount} Events Live</span>
          </div>
          <div className="bg-[#FF6B9D] nb-border px-4 py-2 text-[#1a1a2e] text-sm font-black flex items-center space-x-2 nb-shadow-sm animate-float" style={{ animationDelay: '0.5s' }}>
            <Users className="h-4 w-4" />
            <span>Trusted Platform</span>
          </div>
          <div className="bg-[#00D4FF] nb-border px-4 py-2 text-[#1a1a2e] text-sm font-black flex items-center space-x-2 nb-shadow-sm animate-float" style={{ animationDelay: '1s' }}>
            <Gift className="h-4 w-4" />
            <span>Referral Rewards</span>
          </div>
        </div>
      </div>

      {/* Decorative geometric shapes */}
      <div className="absolute top-8 left-8 w-16 h-16 bg-[#FF6B9D] nb-border rotate-12 opacity-30 animate-float hidden lg:block" />
      <div className="absolute bottom-12 right-12 w-12 h-12 bg-[#7CFC00] nb-border rotate-45 opacity-30 animate-float hidden lg:block" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-4 w-8 h-8 bg-[#00D4FF] nb-border rounded-full opacity-20 animate-float hidden lg:block" style={{ animationDelay: '0.5s' }} />
    </div>
  );
}
