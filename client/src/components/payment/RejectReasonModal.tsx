import { useState } from 'react';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string | null) => void;
}

export function RejectReasonModal({ isOpen, onClose, onSubmit }: RejectReasonModalProps) {
  const [reason, setReason] = useState('');
  if (!isOpen) return null;

  const handleSubmit = () => { onSubmit(reason.trim() || null); setReason(''); };
  const handleClose = () => { setReason(''); onClose(); };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="reject-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white border-4 border-black p-6 max-w-md w-full space-y-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
        <h2 id="reject-title" className="text-xl font-extrabold">Tolak Pembayaran?</h2>
        <label htmlFor="reject-reason" className="block text-sm font-bold text-[#6B7280]">Alasan (opsional)</label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 200))}
          rows={3}
          maxLength={200}
          className="w-full border-2 border-black p-3 text-sm focus:ring-2 focus:ring-[#1A1A2E] focus:outline-none resize-none"
        />
        <div className="flex justify-end gap-2">
          <button onClick={handleClose} className="px-4 py-2 border-2 border-gray-400 font-bold text-sm">Batal</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-[#FF4757] text-white border-2 border-black font-bold text-sm">Tolak</button>
        </div>
      </div>
    </div>
  );
}
