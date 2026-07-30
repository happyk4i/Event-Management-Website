import { LogOut, Ticket, User } from 'lucide-react';
import type { User as UserType } from '../../types.js';

type Props = {
  currentUser: UserType | null;
  activeTab: 'explore' | 'dashboard' | 'bookings' | 'payment-review';
  setActiveTab: (tab: 'explore' | 'dashboard' | 'bookings' | 'payment-review') => void;
  setAuthMode: (mode: 'login' | 'register') => void;
  setIsAuthOpen: (open: boolean) => void;
  handleLogout: () => void;
};

export default function MainNavigation({ currentUser, activeTab, setActiveTab, setAuthMode, setIsAuthOpen, handleLogout }: Props) {
  return (
    <nav className="bg-white nb-border border-t-0 sticky top-0 z-40 px-6 py-4" id="main-navigation">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('explore')}>
          <div className="h-12 w-12 bg-[#FFD700] text-[#1a1a2e] flex items-center justify-center nb-border nb-shadow-sm group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] transition-transform">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tight text-[#1a1a2e] animate-glitch">EVENT KUY</h1>
          </div>
        </div>

        {}
        {currentUser && (
          <div className="flex items-center nb-border bg-[#FFFEF9] p-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-5 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'explore'
                ? 'bg-[#FFD700] text-[#1a1a2e] nb-shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
               Explore
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-5 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'bookings'
                ? 'bg-[#FF6B9D] text-[#1a1a2e] nb-shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
                }`}
            >
               My Bookings
            </button>
            {(currentUser.role === 'Organizer' || currentUser.role === 'Admin') && (
              <button
                onClick={() => setActiveTab('payment-review')}
                className={`px-5 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'payment-review'
                  ? 'bg-[#7CFC00] text-[#1a1a2e] nb-shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                Verification
              </button>
            )}
            {currentUser.role === 'Organizer' && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-5 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'dashboard'
                  ? 'bg-[#00D4FF] text-[#1a1a2e] nb-shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
                  }`}
              >
                📊 Dashboard
              </button>
            )}
          </div>
        )}

        {}
        <div className="flex items-center space-x-3">
          {!currentUser ? (
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthOpen(true);
              }}
              className="nb-btn px-5 py-2.5 bg-[#FF6B9D] text-[#1a1a2e] text-xs flex items-center space-x-2"
              id="login-trigger-btn"
            >
              <User className="h-4 w-4" />
              <span>Sign In / Register</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-[#1a1a2e]">{currentUser.name}</p>
                <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 inline-block ${currentUser.role === 'Organizer' ? 'bg-[#00D4FF]' : 'bg-[#7CFC00]'
                  } border-2 border-[#1a1a2e]`}>
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="nb-btn p-2.5 bg-white text-[#1a1a2e]"
                title="Sign Out Session"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
