import React, { useState } from 'react';
import { User, Mail, Lock, Award, Loader2, ArrowLeft } from 'lucide-react';

interface RegisterPageProps {
  onRegisterSuccess: (userData: any) => void;
  onNavigateToLogin: () => void;
}

export const Register: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setAuthRole] = useState<'Customer' | 'Organizer'>('Customer');
  const [referredBy, setReferredBy] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, referredBy }),
      });

      if (!response.ok) {
        throw new Error('Pendaftaran gagal. Email mungkin sudah terdaftar.');
      }

      const data = await response.json();
      localStorage.setItem('ephemeral_user', JSON.stringify(data.user));
      onRegisterSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2c2440] flex items-center justify-center p-4">
      <div className="w-full max-w-md border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="bg-yellow-400 px-3 py-1 text-sm font-black border-2 border-black inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            EVENT KUY
          </span>
          <h2 className="mt-4 text-3xl font-black">🚀 Create Account</h2>
          <p className="text-gray-600 text-sm mt-1">Gabung dan temukan event seru</p>
        </div>

        {error && (
          <div className="mb-4 border-2 border-black bg-red-100 p-3 text-sm font-bold text-red-700">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-black uppercase mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full border-2 border-black pl-10 pr-4 py-2.5 font-medium outline-none focus:bg-yellow-50"
              />
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-black uppercase mb-1">Daftar Sebagai</label>
              <select
                value={role}
                onChange={(e) => setAuthRole(e.target.value as 'Customer' | 'Organizer')}
                className="w-full border-2 border-black p-2.5 font-black outline-none bg-white"
              >
                <option value="Customer">Customer</option>
                <option value="Organizer">Organizer</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-black uppercase mb-1">Kode Referral</label>
              <input
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                placeholder="PROMO12"
                className="w-full border-2 border-black p-2.5 font-medium outline-none focus:bg-yellow-50 text-center uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1d1b26] text-yellow-400 font-black py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-2px active:translate-y-2px active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : '🚀 DAFTAR AKUN'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-bold text-gray-700">
          Sudah punya akun?{' '}
          <button
            onClick={onNavigateToLogin}
            className="text-pink-600 underline font-black hover:text-pink-700 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register