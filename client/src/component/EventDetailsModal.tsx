import React from 'react';
import { X, Calendar, MapPin, Users, Star, Loader2 } from 'lucide-react';
import type { Event, Review } from '../types.js';
import { formatRupiah } from '../utils/formatters.js';

type Props = {
  isDetailsOpen: boolean;
  selectedEvent: Event | null;
  setIsDetailsOpen: (open: boolean) => void;
  reviewsStats: { totalReviews: number; averageRating: number };
  selectedEventReviews: Review[];
  isReviewsLoading: boolean;
  hasPurchasedSelectedEvent: () => boolean;
  handleSubmitFeedback: (e: React.FormEvent) => void;
  userRating: number;
  setUserRating: (r: number) => void;
  userFeedback: string;
  setUserFeedback: (v: string) => void;
  feedbackError: string | null;
  isSubmittingFeedback: boolean;
  currentUser: any;
  userProfile: any;
  applyCouponId: string;
  setApplyCouponId: (id: string) => void;
  redeemPoints: boolean;
  setRedeemPoints: (r: boolean) => void;
  pointsToUseInput: number;
  setPointsToUseInput: (n: number) => void;
  checkoutPricing: { originalPrice: number; earlyBird: number; coupon: number; points: number; finalPrice: number };
  handleBookTicket: () => void;
  isBooking: boolean;
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
    case 'Music': return 'bg-[#B388FF] border-[#1a1a2e] text-[#1a1a2e]';
    case 'Technology': return 'bg-[#00D4FF] border-[#1a1a2e] text-[#1a1a2e]';
    case 'Arts & Crafts': return 'bg-[#FF6B9D] border-[#1a1a2e] text-[#1a1a2e]';
    case 'Food & Culinary': return 'bg-[#FFD700] border-[#1a1a2e] text-[#1a1a2e]';
    case 'Workshop': return 'bg-[#7CFC00] border-[#1a1a2e] text-[#1a1a2e]';
    case 'Sports': return 'bg-[#FF8C42] border-[#1a1a2e] text-[#1a1a2e]';
    default: return 'bg-white border-[#1a1a2e] text-[#1a1a2e]';
  }
};

export default function EventDetailsModal({
  isDetailsOpen, selectedEvent, setIsDetailsOpen, reviewsStats, selectedEventReviews, isReviewsLoading,
  hasPurchasedSelectedEvent, handleSubmitFeedback, userRating, setUserRating, userFeedback, setUserFeedback,
  feedbackError, isSubmittingFeedback, currentUser, userProfile, applyCouponId, setApplyCouponId,
  redeemPoints, setRedeemPoints, pointsToUseInput, setPointsToUseInput, checkoutPricing, handleBookTicket, isBooking
}: Props) {
  if (!isDetailsOpen || !selectedEvent) return null;
  return (
    <div className="fixed inset-0 nb-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-white nb-border-thick max-w-3xl w-full shadow-2xl relative max-h-[95vh] overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0 nb-shadow-xl animate-bounce-in">
        <button onClick={() => setIsDetailsOpen(false)} className="absolute top-4 right-4 nb-btn p-1.5 bg-white border-2 z-10 hover:bg-[#FF4757] hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>

        {}
        <div className="md:col-span-7 p-6 space-y-5">
          <div className="h-2 -mx-6 -mt-6 mb-4 bg-[#FF6B9D]" />
          <div className="space-y-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border-2 ${getCategoryColor(selectedEvent.category)} inline-flex items-center space-x-1`}>
              <span>{getCategoryIcon(selectedEvent.category)}</span>
              <span>{selectedEvent.category}</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400 block font-bold">SKU: {selectedEvent.code}</span>
            <h3 className="text-xl font-black text-[#1a1a2e] tracking-tight leading-snug">{selectedEvent.name}</h3>
          </div>

          <div className="space-y-2.5 text-xs text-[#1a1a2e] font-bold">
            <div className="flex items-center space-x-2.5">
              <Calendar className="h-4 w-4 text-[#FF6B9D] shrink-0" />
              <span><strong>Date:</strong> {selectedEvent.date} at {selectedEvent.time || '19:00'}</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <MapPin className="h-4 w-4 text-[#FF6B9D] shrink-0" />
              <span><strong>Venue:</strong> {selectedEvent.location}</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <Users className="h-4 w-4 text-[#FF6B9D] shrink-0" />
              <span><strong>Tickets:</strong> {selectedEvent.availableSeats} of {selectedEvent.capacity} left</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 block">📄 About</span>
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 nb-border border-2 font-medium">
              {selectedEvent.description || 'An upcoming premium event scheduled on the platform. Purchase tickets early for early bird pricing! 🎉'}
            </p>
          </div>

          {}
          <div className="space-y-4 pt-3 border-t-3 border-[#1a1a2e]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest font-black text-gray-400 flex items-center space-x-1">
                <Star className="h-3.5 w-3.5 text-[#FFD700] fill-[#FFD700]" />
                <span>Reviews & Feedback</span>
              </span>
              {reviewsStats.totalReviews > 0 && (
                <span className="text-xs font-black text-[#1a1a2e] bg-[#FFD700] nb-border border-2 px-2 py-0.5">
                  ⭐ {reviewsStats.averageRating} / 5 ({reviewsStats.totalReviews})
                </span>
              )}
            </div>

            {isReviewsLoading ? (
              <div className="py-6 text-center text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1" />
                <span className="text-[10px] font-bold">Loading reviews...</span>
              </div>
            ) : selectedEventReviews.length === 0 ? (
              <p className="text-xs text-gray-400 font-bold italic">No reviews yet for this event. 📝</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {selectedEventReviews.map((r) => (
                  <div key={r.id} className="bg-white p-3 nb-border border-2 space-y-1 nb-shadow-sm">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-[#1a1a2e]">{r.userName}</span>
                      <span className="flex items-center text-[#FFD700]">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium italic">"{r.feedback}"</p>
                  </div>
                ))}
              </div>
            )}

            {hasPurchasedSelectedEvent() && (
              <form onSubmit={handleSubmitFeedback} className="bg-[#FFD700]/20 p-4 nb-border border-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#1a1a2e] uppercase">️ Write Review</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-gray-400 font-bold">Rating:</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className={`p-0.5 text-[#FFD700] hover:scale-125 transition-transform ${userRating >= star ? '' : 'opacity-30'}`}
                        >
                          <Star className={`h-4 w-4 ${userRating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {feedbackError && <p className="text-[10px] text-[#FF4757] font-bold">{feedbackError}</p>}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Share your experience..."
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                    className="nb-input flex-1"
                  />
                  <button type="submit" disabled={isSubmittingFeedback} className="nb-btn px-4 py-1.5 bg-[#1a1a2e] text-[#FFD700] text-[10px]">Post</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {}
        <div className="md:col-span-5 bg-[#1a1a2e] border-l-4 border-[#FFD700] p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-widest font-black text-[#FFD700] block border-b-2 border-[#FFD700]/30 pb-2">🎟️ Ticket Checkout</span>
            <div className="bg-[#FFD700] p-4 nb-border border-2 space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-black text-[#1a1a2e]">Standard Price</span>
              <h4 className="text-xl font-black text-[#1a1a2e]">
                {selectedEvent.price === 0 ? 'FREE REGISTRATION 🎉' : formatRupiah(selectedEvent.price)}
              </h4>
              {selectedEvent.price > 0 && <p className="text-[10px] text-[#1a1a2e]/70 font-bold">* 5% early-bird discount if booked 30+ days ahead</p>}
            </div>

            {selectedEvent.price > 0 && currentUser && currentUser.role === 'Customer' && (
              <div className="space-y-3">
                {userProfile?.coupons && userProfile.coupons.length > 0 && (
                  <div className="bg-white/10 p-3.5 border-2 border-[#FFD700]/30 space-y-2">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!applyCouponId}
                        onChange={(e) => setApplyCouponId(e.target.checked ? userProfile.coupons[0].id : '')}
                        className="h-4 w-4 accent-[#FFD700]"
                      />
                      <span className="text-xs font-black text-white">🎟️ Apply Welcome Coupon</span>
                    </label>
                    <p className="text-[9px] text-gray-400 pl-6 font-bold">Extra 10% off at checkout</p>
                  </div>
                )}

                {currentUser.pointsBalance > 0 && (
                  <div className="bg-white/10 p-3.5 border-2 border-[#FFD700]/30 space-y-3">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={redeemPoints}
                        onChange={(e) => {
                          setRedeemPoints(e.target.checked);
                          if (e.target.checked) setPointsToUseInput(currentUser.pointsBalance);
                        }}
                        className="h-4 w-4 accent-[#FFD700]"
                      />
                      <span className="text-xs font-black text-white">💰 Redeem Points</span>
                    </label>
                    {redeemPoints && (
                      <div className="space-y-1 pl-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-gray-300 font-bold font-mono">Use:</span>
                          <input
                            type="number"
                            min="1"
                            max={currentUser.pointsBalance}
                            value={pointsToUseInput}
                            onChange={(e) => setPointsToUseInput(Math.min(currentUser.pointsBalance, Number(e.target.value)))}
                            className="w-24 bg-[#1a1a2e] border-2 border-[#FFD700] p-1.5 text-[10px] font-mono text-center text-[#FFD700] focus:outline-none"
                          />
                        </div>
                        <span className="text-[9px] text-gray-400 block font-bold">(1 pt = IDR 1. Max: {currentUser.pointsBalance} pts)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 bg-white/5 p-4 border-2 border-[#FFD700]/30 text-xs text-gray-300">
              <div className="flex justify-between"><span>Subtotal:</span><span className="font-mono font-bold text-white">{formatRupiah(checkoutPricing.originalPrice)}</span></div>
              {checkoutPricing.earlyBird > 0 && <div className="flex justify-between text-[#7CFC00]"><span>Early Bird (5%):</span><span className="font-mono font-bold">-{formatRupiah(checkoutPricing.earlyBird)}</span></div>}
              {checkoutPricing.coupon > 0 && <div className="flex justify-between text-[#7CFC00]"><span>Coupon (10%):</span><span className="font-mono font-bold">-{formatRupiah(checkoutPricing.coupon)}</span></div>}
              {checkoutPricing.points > 0 && <div className="flex justify-between text-[#7CFC00]"><span>Points Redeemed:</span><span className="font-mono font-bold">-{formatRupiah(checkoutPricing.points)}</span></div>}
              <div className="flex justify-between font-black border-t-2 border-[#FFD700] pt-2 text-[#FFD700] text-base mt-2"><span>TOTAL:</span><span className="text-lg">{formatRupiah(checkoutPricing.finalPrice)}</span></div>
            </div>
          </div>

          <button
            onClick={handleBookTicket}
            disabled={isBooking || selectedEvent.availableSeats <= 0}
            className={`w-full py-3.5 nb-btn text-sm ${selectedEvent.availableSeats <= 0 ? 'bg-gray-600 text-gray-400 cursor-not-allowed border-gray-500' : 'bg-[#FFD700] text-[#1a1a2e] animate-pulse-glow'}`}
          >
            {isBooking ? '⏳ Processing...' : selectedEvent.availableSeats <= 0 ? '🚫 SOLD OUT' : '🎫 Confirm & Purchase Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}
