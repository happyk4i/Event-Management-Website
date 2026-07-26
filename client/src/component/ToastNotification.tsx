import { X } from 'lucide-react';

type ToastType = { message: string; type: 'success' | 'error' } | null;

export default function ToastNotification({ toast, onClose }: { toast: ToastType; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex items-center space-x-3 px-5 py-4 nb-border animate-bounce-in ${toast.type === 'success'
        ? 'bg-[#7CFC00] nb-shadow'
        : 'bg-[#FF4757] text-white nb-shadow-red'
        }`}
    >
      <div className="flex items-center space-x-2">
        <span className={`text-base ${toast.type === 'success' ? '' : 'text-white'}`}>
          {toast.type === 'success' ? '' : '️'}
        </span>
        <span className="text-sm font-bold mt-0.5">{toast.message}</span>
      </div>
      <button onClick={onClose} className="ml-2 hover:rotate-90 transition-transform">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
