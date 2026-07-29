import React from 'react';
import { Calendar, MapPin, CalendarDays, Database, ShieldAlert, Loader2 } from 'lucide-react';
import { CATEGORIES, Event } from '../types.js';
import { formatRupiah } from '../utils/formatters.js';

type Props = {
  events: Event[];
  viewMode: 'grid' | 'list';
  currentUser: any;
  isLoading: boolean;
  error: string | null;
  onOpenDetails: (ev: Event) => void;
  onOpenEdit: (ev: Event, e: React.MouseEvent) => void;
  onDeleteEvent: (id: string, name: string, e: React.MouseEvent) => void;
  onSeedDatabase: () => void;
  isSeeding: boolean;
  searchQuery: string;
  selectedCategory: string;
  fetchEvents: () => void;
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Music': return '🎵';
    case 'Technology': return '💻';
    case 'Arts & Crafts': return '🎨';
    case 'Food & Culinary': return '🍜';
    case 'Workshop': return '📚';
    case 'Sports': return '🏆';
    default: return '📌';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Music': return 'bg-[#B388FF] text-[#1a1a2e] border-[#1a1a2e]';
    case 'Technology': return 'bg-[#00D4FF] text-[#1a1a2e] border-[#1a1a2e]';
    case 'Arts & Crafts': return 'bg-[#FF6B9D] text-[#1a1a2e] border-[#1a1a2e]';
    case 'Food & Culinary': return 'bg-[#FFD700] text-[#1a1a2e] border-[#1a1a2e]';
    case 'Workshop': return 'bg-[#7CFC00] text-[#1a1a2e] border-[#1a1a2e]';
    case 'Sports': return 'bg-[#FF8C42] text-[#1a1a2e] border-[#1a1a2e]';
    default: return 'bg-white text-[#1a1a2e] border-[#1a1a2e]';
  }
};

const accents = ['#FFD700', '#FF6B9D', '#00D4FF', '#7CFC00', '#B388FF', '#FF8C42'];

export default function EventCatalog({
  events, viewMode, currentUser, isLoading, error, onOpenDetails, onOpenEdit, onDeleteEvent, onSeedDatabase, isSeeding, searchQuery, selectedCategory, fetchEvents
}: Props) {
  if (isLoading) {
    return (
      <div className="bg-white nb-border py-28 text-center flex flex-col items-center justify-center space-y-4 nb-shadow">
        <div className="h-16 w-16 bg-[#FFD700] nb-border flex items-center justify-center animate-spin rounded-full">
          <Loader2 className="h-8 w-8 text-[#1a1a2e]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-widest font-black text-[#1a1a2e]">Loading Events...</p>
          <p className="text-xs text-gray-500 font-medium">Fetching data from the ledger 📡</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center bg-[#FF4757] nb-border p-6 flex flex-col items-center justify-center nb-shadow text-white">
        <ShieldAlert className="h-14 w-14 mb-3" />
        <h3 className="text-sm font-black uppercase tracking-widest">DATABASE ERROR!</h3>
        <p className="text-xs mt-1.5 max-w-md leading-relaxed">{error}</p>
        <button onClick={fetchEvents} className="mt-5 nb-btn px-5 py-2.5 bg-white text-[#1a1a2e] text-xs">
          🔄 Reload Catalog
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white nb-border py-20 text-center p-6 space-y-4 nb-shadow">
        <div className="mx-auto h-20 w-20 bg-[#FFD700] nb-border text-[#1a1a2e] flex items-center justify-center rounded-full animate-float">
          <CalendarDays className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-[#1a1a2e]">No Events Found 😔</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed font-medium">
            No results for "{searchQuery}" in {selectedCategory}. Seed some events to get started!
          </p>
        </div>
        <button
          onClick={onSeedDatabase}
          disabled={isSeeding}
          className="nb-btn px-6 py-3 bg-[#7CFC00] text-[#1a1a2e] text-sm flex items-center space-x-2 mx-auto"
        >
          <Database className="h-4 w-4" />
          <span>{isSeeding ? 'Seeding...' : '🌱 Seed Events'}</span>
        </button>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="grid-layout">
        {events.map((ev, index) => {
          const capacityPercent = Math.round((ev.availableSeats / ev.capacity) * 100);
          const isSoldOut = ev.availableSeats === 0 || ev.status === 'Sold Out';
          const isLowStock = ev.availableSeats > 0 && ev.availableSeats < 15;
          const accent = accents[index % accents.length];
          return (
            <div
              key={ev.id}
              onClick={() => onOpenDetails(ev)}
              className={`bg-white nb-border-thick nb-card-hover flex flex-col cursor-pointer relative group overflow-hidden animate-card-enter stagger-${(index % 6) + 1}`}
              style={{ boxShadow: `4px 4px 0px #1a1a2e` }}
            >
              <div className="h-2" style={{ backgroundColor: accent }} />
              <div className="px-5 pt-4 flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border-2 ${getCategoryColor(ev.category)} flex items-center space-x-1.5`}>
                  <span>{getCategoryIcon(ev.category)}</span>
                  <span>{ev.category}</span>
                </span>
                {currentUser && currentUser.role === 'Organizer' && currentUser.id === ev.organizerId && (
                  <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => onOpenEdit(ev, e)} className="nb-btn p-1.5 bg-[#00D4FF] text-[#1a1a2e] border-2" title="Edit Event">️</button>
                    <button onClick={(e) => onDeleteEvent(ev.id, ev.name, e)} className="nb-btn p-1.5 bg-[#FF4757] text-white border-2" title="Delete Event">🗑️</button>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-black tracking-widest uppercase" style={{ color: accent }}>{ev.code}</span>
                  <h4 className="text-lg font-black text-[#1a1a2e] leading-snug truncate group-hover:text-[#FF6B9D] transition-colors">{ev.name}</h4>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 h-8 leading-relaxed font-medium">
                  {ev.description || 'Join this upcoming premium event in Indonesia. Book early for amazing discounts! 🎉'}
                </p>
                <div className="space-y-2 pt-1 text-[#1a1a2e] text-xs font-semibold">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3.5 w-3.5" style={{ color: accent }} />
                    <span>{ev.date} at {ev.time || '19:00'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
                    <span className="truncate">{ev.location}</span>
                  </div>
                </div>
                <div className="pt-3 border-t-3 border-dashed border-gray-300 flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest text-gray-400 font-black">Price</span>
                  <span className="font-black text-lg text-[#1a1a2e]">
                    {ev.price === 0 ? <span className="bg-[#7CFC00] nb-border border-2 px-2 py-0.5 text-sm">FREE!</span> : formatRupiah(ev.price)}
                  </span>
                </div>
              </div>
              <div className="px-5 pb-4 pt-3 bg-gray-50 space-y-2.5 border-t-3 border-[#1a1a2e]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-bold">Seat Inventory</span>
                  <span className={`font-mono font-black px-2.5 py-1 border-2 border-[#1a1a2e] text-[10px] ${isSoldOut ? 'bg-[#FF4757] text-white' : isLowStock ? 'bg-[#FFD700] text-[#1a1a2e] animate-pulse' : 'bg-[#7CFC00] text-[#1a1a2e]'}`}>
                    {isSoldOut ? '🚫 SOLD OUT' : `${ev.availableSeats} / ${ev.capacity} left`}
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-200 nb-border border-2 overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${isSoldOut ? 'bg-[#FF4757]' : isLowStock ? 'bg-[#FFD700]' : 'bg-[#7CFC00]'}`} style={{ width: `${Math.min(100, Math.max(0, capacityPercent))}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }


  return (
    <div className="bg-white nb-border nb-shadow overflow-hidden" id="list-layout">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FFD700] border-b-3 border-[#1a1a2e] text-[10px] uppercase tracking-widest font-black text-[#1a1a2e]">
              <th className="py-4 px-5">Event</th>
              <th className="py-4 px-5">SKU Code</th>
              <th className="py-4 px-5">Category</th>
              <th className="py-4 px-5">Schedule & Venue</th>
              <th className="py-4 px-5 text-right">Price</th>
              <th className="py-4 px-5 text-center">Status</th>
              <th className="py-4 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-3 divide-[#1a1a2e] text-xs text-[#1a1a2e]">
            {events.map((ev, index) => {
              const isSoldOut = ev.availableSeats === 0 || ev.status === 'Sold Out';
              return (
                <tr key={ev.id} onClick={() => onOpenDetails(ev)} className={`cursor-pointer transition-colors hover:bg-[#FFD700]/10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-4 px-5">
                    <p className="text-sm font-black text-[#1a1a2e] leading-snug">{ev.name}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5 font-mono font-bold">ID: {ev.id.slice(0, 8).toUpperCase()}</p>
                  </td>
                  <td className="py-4 px-5 font-mono text-[11px] font-black text-[#1a1a2e] uppercase">
                    <span className="bg-gray-100 nb-border border-2 px-2 py-0.5">{ev.code}</span>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 border-2 text-[9px] font-black uppercase tracking-wider ${getCategoryColor(ev.category)}`}>
                      <span>{getCategoryIcon(ev.category)}</span>
                      <span>{ev.category}</span>
                    </span>
                  </td>
                  <td className="py-4 px-5 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <Calendar className="h-3 w-3 text-[#FF6B9D]" />
                      <span>{ev.date} at {ev.time || '19:00'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 font-medium">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[150px]">{ev.location}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-right font-black text-[#1a1a2e] text-sm">
                    {ev.price === 0 ? <span className="bg-[#7CFC00] border-2 border-[#1a1a2e] px-2 py-0.5 text-[10px]">FREE!</span> : formatRupiah(ev.price)}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className={`inline-block font-mono font-black px-3 py-1 border-2 border-[#1a1a2e] text-[10px] ${isSoldOut ? 'bg-[#FF4757] text-white' : 'bg-[#7CFC00] text-[#1a1a2e]'}`}>
                      {isSoldOut ? '🚫 SOLD OUT' : `${ev.availableSeats} / ${ev.capacity}`}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button className="nb-btn px-3 py-1.5 text-[10px] bg-[#FFD700] text-[#1a1a2e]">View →</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
