import React from 'react';
import { CATEGORIES, STATUSES } from '../../../types.js';
import { Search, Grid, RefreshCw } from 'lucide-react';

type Props = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setDebouncedSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedStatus: string;
  setSelectedStatus: (st: string) => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  currentUser: any;
  debouncedSearchQuery: string;
  viewMode: 'grid' | 'list';
  setViewMode: (m: 'grid' | 'list') => void;
  setCurrentPage: (p: number) => void;
};

export default function EventFilters({
  searchQuery, setSearchQuery, setDebouncedSearchQuery,
  selectedCategory, setSelectedCategory,
  selectedStatus, setSelectedStatus,
  selectedLocation, setSelectedLocation,
  currentUser, debouncedSearchQuery, viewMode, setViewMode, setCurrentPage
}: Props) {
  return (
    <div className="bg-white nb-border p-5 nb-shadow space-y-4" id="filters-container">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">

        {}
        <div className="relative flex-1">
          <Search className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-opacity ${searchQuery ? 'opacity-0' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder="Search events by title, SKU, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nb-input w-full pl-10 pr-12"
            id="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearchQuery('');
              }}
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 bg-[#FF4757] text-white nb-border border-2 px-2 py-0.5 text-[10px] font-black uppercase hover:bg-[#FF6B9D] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="nb-select"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] whitespace-nowrap">City:</span>
          <input
            type="text"
            placeholder="e.g. Jakarta"
            value={selectedLocation}
            onChange={(e) => {
              setSelectedLocation(e.target.value);
              setCurrentPage(1);
            }}
            className="nb-input max-w-[140px]"
          />
        </div>

        {}
        {currentUser?.role === 'Organizer' && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#1a1a2e] whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="nb-select"
            >
              <option value="All">All Status</option>
              {STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        )}

        {}
        <div className="flex items-center nb-border bg-[#FFFEF9] p-1 self-start lg:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-[#FFD700] text-[#1a1a2e] nb-shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
            title="Grid layout"
          >
            <Grid className="h-4 w-4" />
          </button>
        </div>
                </div>
              </div>
            );
        }
