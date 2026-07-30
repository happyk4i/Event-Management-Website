import { useState } from 'react';

interface ProofPreviewProps {
  url: string | null;
  alt?: string;
}

export function ProofPreview({ url, alt = 'Bukti pembayaran' }: ProofPreviewProps) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-24 h-24 border-2 border-black overflow-hidden hover:opacity-80 transition-opacity focus:ring-2 focus:ring-[#1A1A2E]"
        aria-label="Lihat bukti pembayaran"
      >
        <img src={url} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white text-2xl font-bold hover:opacity-70 z-10"
            aria-label="Tutup"
          >✕</button>
          <img src={url} alt={alt} className="max-w-full max-h-[90vh] object-contain border-4 border-white shadow-2xl" />
        </div>
      )}
    </>
  );
}
