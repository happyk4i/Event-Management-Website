import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  setCurrentPage: (p: number) => void;
};

export default function Pagination({ currentPage, totalPages, totalCount, setCurrentPage }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4" id="pagination-controls">
      <span className="text-xs text-gray-500 font-bold">
        Page <span className="bg-[#FFD700] px-2 py-0.5 nb-border border-2 font-black text-[#1a1a2e]">{currentPage}</span> of <strong>{totalPages}</strong> ({totalCount} events)
      </span>
      <div className="flex items-center space-x-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          className="nb-btn p-2 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={`nb-btn px-3.5 py-1.5 text-xs font-mono transition-all ${currentPage === idx + 1
              ? 'bg-[#1a1a2e] text-[#FFD700]'
              : 'bg-white text-[#1a1a2e]'
              }`}
          >
            {idx + 1}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          className="nb-btn p-2 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
