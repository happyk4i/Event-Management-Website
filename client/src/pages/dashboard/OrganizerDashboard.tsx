import React from 'react';
import { Plus, BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import type { Event } from '../../types.js';
import { formatRupiah } from '../../utils/formatters';

type Props = {
  dashboardStats: any;
  statsRange: 'daily' | 'monthly' | 'yearly';
  setStatsRange: (r: 'daily' | 'monthly' | 'yearly') => void;
  events: Event[];
  currentUser: any;
  openCreateModal: () => void;
  openEditModal: (ev: Event, e: React.MouseEvent) => void;
  handleDeleteEvent: (id: string, name: string, e: React.MouseEvent) => void;
};

export default function OrganizerDashboard({
  dashboardStats, statsRange, setStatsRange, events, currentUser, openCreateModal, openEditModal, handleDeleteEvent
}: Props) {
  return (
    <div className="space-y-8" id="dashboard-panel">
      {}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b-4 border-[#1a1a2e]">
        <div>
          <h2 className="text-3xl font-black text-[#1a1a2e]">📊 Management Suite</h2>
          <p className="text-sm text-gray-500 mt-0.5 font-medium">Publish events, track sales, monitor revenue in real-time</p>
        </div>
        <button
          onClick={openCreateModal}
          className="nb-btn px-6 py-3 bg-[#7CFC00] text-[#1a1a2e] text-sm flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>List New Event</span>
        </button>
      </div>

      {}
      {dashboardStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-[#FFD700] nb-border-thick p-6 nb-shadow-lg nb-card-hover">
            <span className="text-[10px] uppercase tracking-widest font-black text-[#1a1a2e]">💰 Total Revenue</span>
            <h3 className="text-2xl font-black text-[#1a1a2e] mt-2">{formatRupiah(dashboardStats.summary?.totalSalesRevenue || 0)}</h3>
            <p className="text-xs font-bold flex items-center space-x-1 mt-2 text-[#1a1a2e]/70"><TrendingUp className="h-3.5 w-3.5 shrink-0" /><span>Verified payouts</span></p>
          </div>
          <div className="bg-[#FF6B9D] nb-border-thick p-6 nb-shadow-lg nb-card-hover">
            <span className="text-[10px] uppercase tracking-widest font-black text-[#1a1a2e]">🎫 Tickets Sold</span>
            <h3 className="text-3xl font-black text-[#1a1a2e] mt-2">{dashboardStats.summary?.ticketsSold || 0}</h3>
            <p className="text-xs font-bold mt-2 text-[#1a1a2e]/70">Attendees registered</p>
          </div>
          <div className="bg-[#00D4FF] nb-border-thick p-6 nb-shadow-lg nb-card-hover">
            <span className="text-[10px] uppercase tracking-widest font-black text-[#1a1a2e]">📅 Active Events</span>
            <h3 className="text-3xl font-black text-[#1a1a2e] mt-2">{dashboardStats.summary?.activeEventsCount || 0}</h3>
            <p className="text-xs font-bold mt-2 text-[#1a1a2e]/70">Open for booking</p>
          </div>
        </div>
      ) : (
        <div className="bg-white nb-border p-8 text-center nb-shadow">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#FFD700]" />
          <span className="text-sm font-bold text-gray-500">Computing analytics... 📊</span>
        </div>
      )}

      {}
      <div className="bg-white nb-border p-6 nb-shadow space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-3 border-[#1a1a2e] pb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-[#FF6B9D]" />
            <h4 className="text-sm font-black uppercase tracking-wider text-[#1a1a2e]">Sales & Occupancy Analytics</h4>
          </div>
          <div className="flex items-center nb-border bg-[#FFFEF9] p-1">
            {(['daily', 'monthly', 'yearly'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setStatsRange(range)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${statsRange === range ? 'bg-[#FFD700] text-[#1a1a2e] nb-shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {dashboardStats && dashboardStats.reports ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block">💰 Revenue Over Time</span>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardStats.reports[statsRange] || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFD700" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#1a1a2e" fontSize={10} tickLine={false} fontWeight={700} />
                    <YAxis stroke="#1a1a2e" fontSize={10} tickLine={false} fontWeight={700} />
                    <Tooltip formatter={(value) => [formatRupiah(Number(value)), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block">🎫 Ticket Volume</span>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardStats.reports[statsRange] || []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#1a1a2e" fontSize={10} tickLine={false} fontWeight={700} />
                    <YAxis stroke="#1a1a2e" fontSize={10} tickLine={false} fontWeight={700} />
                    <Tooltip formatter={(value) => [value, 'Tickets Sold']} />
                    <Bar dataKey="tickets" fill="#FF6B9D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 nb-border">
            <p className="text-sm text-gray-400 font-bold">No transaction data yet. Charts need ticket sales. 📈</p>
          </div>
        )}
      </div>

      {}
      <div className="bg-white nb-border p-6 nb-shadow space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-3 border-[#1a1a2e]">
          <span className="text-sm font-black uppercase tracking-wider text-[#1a1a2e]">📋 Your Managed Events</span>
          <span className="text-[10px] text-gray-400 font-mono font-bold">Edit/Remove from here</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1a1a2e] border-collapse">
            <thead>
              <tr className="bg-[#1a1a2e] text-[#FFD700] text-[10px] uppercase tracking-wider font-black">
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-center">Seats</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#1a1a2e]">
              {events.filter((e) => e.organizerId === currentUser?.id).map((ev) => (
                <tr key={ev.id} className="hover:bg-[#FFD700]/10 transition-colors">
                  <td className="py-3 px-4 font-black text-[#1a1a2e]">{ev.name}</td>
                  <td className="py-3 px-4 font-mono font-bold"><span className="bg-gray-100 border-2 border-[#1a1a2e] px-1.5 py-0.5">{ev.code}</span></td>
                  <td className="py-3 px-4 font-medium">{ev.date}</td>
                  <td className="py-3 px-4 text-right font-bold">{ev.price === 0 ? 'FREE' : formatRupiah(ev.price)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 border-2 border-[#1a1a2e] text-[10px] font-mono font-black ${ev.availableSeats === 0 ? 'bg-[#FF4757] text-white' : 'bg-[#7CFC00] text-[#1a1a2e]'}`}>
                      {ev.availableSeats} / {ev.capacity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button onClick={(e) => openEditModal(ev, e)} className="text-[11px] font-black text-[#00D4FF] hover:text-[#FF6B9D] uppercase transition-colors">️ Edit</button>
                    <button onClick={(e) => handleDeleteEvent(ev.id, ev.name, e)} className="text-[11px] font-black text-[#FF4757] hover:text-[#1a1a2e] uppercase transition-colors">🗑️ Remove</button>
                  </td>
                </tr>
              ))}
              {events.filter((e) => e.organizerId === currentUser?.id).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400 font-bold">
                    You haven't listed any events yet. Click "List New Event" to start! 🚀
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
