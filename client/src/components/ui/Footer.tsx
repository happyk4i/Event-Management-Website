import { Ticket } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] border-t-4 border-[#FFD700] py-10 px-6 text-center mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-[#FFD700] nb-border flex items-center justify-center">
            <Ticket className="h-5 w-5 text-[#1a1a2e]" />
          </div>
          <div className="text-left">
            <span className="font-black text-lg text-[#FFD700]">EVENT KUY</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {['Music', 'Tech', 'Art', 'Food', 'Sports'].map((cat) => (
            <span key={cat} className="bg-[#1a1a2e] text-gray-300 border-2 border-gray-600 px-3 py-1 text-[10px] font-bold uppercase hover:border-[#FFD700] hover:text-[#FFD700] transition-colors cursor-pointer">
              {cat}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 font-bold">© 2026 Event Kuy. All rights reserved. 🇮🇩</p>
      </div>
    </footer>
  );
}
