import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react'

interface LoginPageProps {
  onLoginSuccess: (userData: any) => void;
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Email atau password salah. Silakan coba lagi.');
      }

      const data = await response.json();
      localStorage.setItem('ephemeral_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2c2440] flex items-center justify-center p-4">
      <div className="w-full max-w-md border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
        {/* Logo / Header */}
        <div className="text-center mb-6">
          <span className="bg-yellow-400 px-3 py-1 text-sm font-black border-2 border-black inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            EVENT KUY
          </span>
          <h2 className="mt-4 text-3xl font-black">👋 Welcome Back!</h2>
          <p className="text-gray-600 text-sm mt-1">Silakan masuk ke akun Anda</p>
        </div>

        {error && (
          <div className="mb-4 border-2 border-black bg-red-100 p-3 text-sm font-bold text-red-700 flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-black uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.id"
                className="w-full border-2 border-black pl-10 pr-4 py-2.5 font-medium outline-none focus:bg-yellow-50"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-black uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-2 border-black pl-10 pr-4 py-2.5 font-medium outline-none focus:bg-yellow-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1d1b26] text-yellow-400 font-black py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-2px active:translate-y-2px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> SIGNING IN...
              </>
            ) : (
              '🔑 SIGN IN'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-bold text-gray-700">
          Belum punya akun?{' '}
          <button
            onClick={onNavigateToRegister}
            className="text-pink-600 underline font-black hover:text-pink-700 inline-flex items-center gap-1"
          >
            Daftar Sekarang <ArrowRight className="h-4 w-4" />
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login