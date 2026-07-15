import React from 'react';
import { X, AlertCircle } from 'lucide-react';

type Props = {
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  authName: string;
  setAuthName: (val: string) => void;
  authEmail: string;
  setAuthEmail: (val: string) => void;
  authPassword: string;
  setAuthPassword: (val: string) => void;
  authRole: 'Customer' | 'Organizer';
  setAuthRole: (val: 'Customer' | 'Organizer') => void;
  authReferredBy: string;
  setAuthReferredBy: (val: string) => void;
  authError: string | null;
  handleLogin: (e: React.FormEvent) => void;
  handleRegister: (e: React.FormEvent) => void;
  resetAuthFields: () => void;
};

export default function AuthModal({
  isAuthOpen, setIsAuthOpen, authMode, setAuthMode,
  authName, setAuthName, authEmail, setAuthEmail,
  authPassword, setAuthPassword, authRole, setAuthRole,
  authReferredBy, setAuthReferredBy, authError,
  handleLogin, handleRegister, resetAuthFields
}: Props) {
  if (!isAuthOpen) return null;
  return (
    <div className="fixed inset-0 nb-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-white nb-border-thick max-w-md w-full shadow-2xl relative nb-shadow-lg animate-bounce-in overflow-hidden">
        {/* Colored header bar */}
        <div className="h-3 bg-[#FF6B9D]" />

        <div className="p-6">
          <button
            onClick={() => {
              setIsAuthOpen(false);
              resetAuthFields();
            }}
            className="absolute top-6 right-5 nb-btn p-1 bg-white border-2 hover:bg-[#FF4757] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-center mb-6">
            <span className="inline-block bg-[#FFD700] nb-border border-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-3">🎫 Event Kuy</span>
            <h3 className="text-2xl font-black text-[#1a1a2e]">
              {authMode === 'login' ? '👋 Welcome Back!' : '🚀 Join Now!'}
            </h3>
          </div>

          {authError && (
            <div className="bg-[#FF4757] nb-border border-2 p-3 mb-4 text-xs text-white flex items-center space-x-2 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Isyana Sarasvati"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="nb-input w-full"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="name@domain.id"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="nb-input w-full"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="nb-input w-full"
              />
            </div>

            {authMode === 'register' && (
              <>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-2">Select Your Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAuthRole('Customer')}
                      className={`nb-btn py-2.5 text-xs ${authRole === 'Customer' ? 'bg-[#7CFC00] text-[#1a1a2e]' : 'bg-white text-gray-500'}`}
                    >
                      🎭 Attendee
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthRole('Organizer')}
                      className={`nb-btn py-2.5 text-xs ${authRole === 'Organizer' ? 'bg-[#00D4FF] text-[#1a1a2e]' : 'bg-white text-gray-500'}`}
                    >
                      🎯 Organizer
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Referral Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. REF-BUDI-1234"
                    value={authReferredBy}
                    onChange={(e) => setAuthReferredBy(e.target.value)}
                    className="nb-input w-full"
                  />
                  <span className="text-[9px] text-gray-400 mt-1 block font-bold">🎁 Get a 10% welcome coupon valid for 3 months!</span>
                </div>
              </>
            )}

            <button
              type="submit"
              className="nb-btn w-full py-3 bg-[#1a1a2e] text-[#FFD700] text-sm mt-4"
            >
              {authMode === 'login' ? '🔐 Sign In' : '🚀 Create Account'}
            </button>
          </form>

          <div className="pt-4 border-t-3 border-[#1a1a2e] text-center text-xs mt-6">
            {authMode === 'login' ? (
              <p className="font-bold text-gray-500">
                New here?{' '}
                <button onClick={() => setAuthMode('register')} className="text-[#FF6B9D] font-black hover:underline">
                  Create account →
                </button>
              </p>
            ) : (
              <p className="font-bold text-gray-500">
                Already have one?{' '}
                <button onClick={() => setAuthMode('login')} className="text-[#FF6B9D] font-black hover:underline">
                  Sign in →
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
