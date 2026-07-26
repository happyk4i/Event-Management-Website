import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { CATEGORIES, STATUSES } from '../types.js';

type Props = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  modalMode: 'create' | 'edit';
  formError: string | null;
  formName: string;
  setFormName: (val: string) => void;
  formDescription: string;
  setFormDescription: (val: string) => void;
  formCode: string;
  setFormCode: (val: string) => void;
  formCategory: string;
  setFormCategory: (val: string) => void;
  formPrice: number;
  setFormPrice: (val: number) => void;
  formCapacity: number;
  setFormCapacity: (val: number) => void;
  formAvailableSeats: number;
  setFormAvailableSeats: (val: number) => void;
  formDate: string;
  setFormDate: (val: string) => void;
  formTime: string;
  setFormTime: (val: string) => void;
  formLocation: string;
  setFormLocation: (val: string) => void;
  formStatus: string;
  setFormStatus: (val: string) => void;
  handleAutoGenerateCode: () => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
};

export default function EventFormModal({
  isModalOpen, setIsModalOpen, modalMode, formError,
  formName, setFormName, formDescription, setFormDescription,
  formCode, setFormCode, formCategory, setFormCategory,
  formPrice, setFormPrice, formCapacity, setFormCapacity,
  formAvailableSeats, setFormAvailableSeats, formDate, setFormDate,
  formTime, setFormTime, formLocation, setFormLocation,
  formStatus, setFormStatus, handleAutoGenerateCode,
  handleFormSubmit, isSubmitting
}: Props) {
  if (!isModalOpen) return null;
  return (
    <div className="fixed inset-0 nb-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-white nb-border-thick max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto nb-shadow-lg animate-bounce-in">
        {/* Colored header */}
        <div className="h-3 bg-[#7CFC00]" />

        <div className="p-6">
          <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-5 nb-btn p-1 bg-white border-2 hover:bg-[#FF4757] hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>

          <div className="mb-5 pb-3 border-b-3 border-[#1a1a2e]">
            <span className="inline-block bg-[#7CFC00] nb-border border-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest mb-2">🛠️ Organizer Tool</span>
            <h3 className="text-xl font-black text-[#1a1a2e]">
              {modalMode === 'create' ? '📝 Publish New Event' : '️ Edit Event Details'}
            </h3>
          </div>

          {formError && (
            <div className="bg-[#FF4757] nb-border border-2 p-3 mb-4 text-xs text-white flex items-center space-x-2 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Event Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Intimate Concert with Isyana"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="nb-input w-full"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Description</label>
              <textarea
                placeholder="Write an exciting description..."
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="nb-input w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">SKU Code</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    placeholder="SKU-2026-99"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="nb-input w-full font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleAutoGenerateCode}
                    className="nb-btn px-3 py-1 text-[10px] bg-[#FFD700]"
                  >
                    Gen
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="nb-select w-full"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Price (IDR)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  className="nb-input w-full font-mono"
                />
                <span className="text-[8px] text-gray-400 mt-1 block font-bold">0 = Free event</span>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formCapacity}
                  onChange={(e) => {
                    setFormCapacity(Number(e.target.value));
                    if (modalMode === 'create') {
                      setFormAvailableSeats(Number(e.target.value));
                    }
                  }}
                  className="nb-input w-full font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Available</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formAvailableSeats}
                  onChange={(e) => setFormAvailableSeats(Number(e.target.value))}
                  className="nb-input w-full font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="nb-input w-full"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Time</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 19:30"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="nb-input w-full font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Venue Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Gelora Bung Karno, Jakarta"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="nb-input w-full"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-black text-[#1a1a2e] block mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="nb-select w-full"
              >
                {STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="nb-btn w-full py-3 bg-[#1a1a2e] text-[#7CFC00] disabled:opacity-40 text-sm mt-4"
            >
              {isSubmitting ? '⏳ Saving...' : modalMode === 'create' ? '🚀 Publish Event' : '💾 Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
