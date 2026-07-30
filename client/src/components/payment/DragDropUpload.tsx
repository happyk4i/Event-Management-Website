import { useState, useRef } from 'react';
import { Upload, X, FileImage } from 'lucide-react';

interface DragDropUploadProps {
  onFile: (file: File | null) => void;
  error?: string | null;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

export function DragDropUpload({ onFile, error, disabled }: DragDropUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Hanya file JPEG, PNG, atau WebP.';
    if (file.size > MAX_BYTES) return `Ukuran maksimal 5 MB. File ini ${(file.size / 1024 / 1024).toFixed(1)} MB.`;
    return null;
  };

  const handleFile = (f: File) => {
    const err = validate(f);
    if (err) {
      setLocalError(err);
      onFile(null);
      return;
    }
    setLocalError(null);
    setPreview(URL.createObjectURL(f));
    onFile(f);
  };

  const clearFile = () => {
    setPreview(null);
    setLocalError(null);
    onFile(null);
  };

  const showDrag = dragOver && !disabled ? 'bg-[#FFD700]/20' : 'bg-white';

  return (
    <div
      onDragOver={(e) => { if (!disabled) { e.preventDefault(); setDragOver(true); } }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!disabled && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      className={`border-2 border-dashed border-black p-6 text-center transition-colors duration-200 focus-within:ring-2 focus-within:ring-[#1A1A2E] ${showDrag} ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload bukti pembayaran. Tekan Enter untuk memilih file."
      aria-disabled={disabled}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); inputRef.current?.click(); } }}
      onClick={() => { if (!disabled) inputRef.current?.click(); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        className="sr-only"
        aria-hidden="true"
        disabled={disabled}
      />

      {preview ? (
        <div className="flex items-center gap-3">
          <img src={preview} alt="Pratinjau bukti pembayaran" className="w-16 h-16 object-cover border-2 border-black" />
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold truncate">File siap diupload</p>
            <p className="text-xs text-[#6B7280]">Tekan tombol konfirmasi di bawah</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clearFile(); }}
            className="p-1 text-[#FF4757] hover:opacity-80 transition-opacity"
            aria-label="Hapus file"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload size={28} className="text-[#1A1A2E]" aria-hidden="true" />
          <p className="text-sm font-bold">Seret file ke sini, atau klik untuk pilih</p>
          <p className="text-xs text-[#6B7280]">JPEG / PNG / WebP, maks 5 MB</p>
          <span className="mt-2 inline-flex items-center gap-1 px-4 py-2 bg-[#FFD700] border-2 border-black font-bold text-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-transform">
            <FileImage size={16} aria-hidden="true" /> Pilih File
          </span>
        </div>
      )}

      {(localError || error) && (
        <p role="alert" className="mt-2 text-sm text-[#DC2626] font-bold">{localError || error}</p>
      )}
    </div>
  );
}
