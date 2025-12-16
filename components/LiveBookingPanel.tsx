import React from 'react';
import { DraftBooking } from '../types';

interface LiveBookingPanelProps {
  draft: DraftBooking;
}

const LiveBookingPanel: React.FC<LiveBookingPanelProps> = ({ draft }) => {
  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden flex flex-col animate-fade-in-up transform transition-all">
      {/* Receipt Header */}
      <div className="bg-navy-900 p-4 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300"></div>
        <div className="relative z-10">
            <h3 className="font-serif font-bold tracking-widest text-gold-100 uppercase text-sm">Draft Booking</h3>
            <p className="text-[10px] font-mono text-stone-400 mt-1">
                ID: {draft.bookingId || '...'}
            </p>
        </div>
      </div>

      <div className="p-6 space-y-5 flex-1 bg-stone-50 relative">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cardboard.png')] pointer-events-none"></div>

        {/* Guest Name & Email */}
        <div className={`transition-all duration-500 ${draft.guestName ? 'opacity-100 translate-x-0' : 'opacity-40'}`}>
          <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Guest Details</label>
          <div className="text-lg font-serif font-bold text-navy-900 border-b border-stone-200 pb-1 leading-tight">
            {draft.guestName || "—"}
          </div>
          {draft.email && (
            <div className="text-xs text-stone-500 mt-1 font-mono break-all">
              {draft.email}
            </div>
          )}
        </div>

        {/* Stay Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`transition-all duration-500 delay-75 ${draft.checkIn ? 'opacity-100' : 'opacity-40'}`}>
            <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Check-in</label>
            <div className="font-semibold text-stone-800 text-sm">{draft.checkIn || "—"}</div>
          </div>
          <div className={`transition-all duration-500 delay-100 ${draft.checkOut ? 'opacity-100' : 'opacity-40'}`}>
            <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Check-out</label>
            <div className="font-semibold text-stone-800 text-sm">{draft.checkOut || "—"}</div>
          </div>
        </div>

        {/* Room Selection */}
        <div className={`bg-white p-3 rounded-lg border border-stone-100 shadow-sm transition-all duration-500 delay-150 ${draft.roomType ? 'opacity-100 scale-100' : 'opacity-60 scale-95'}`}>
          <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-bold text-stone-400 uppercase">Room Type</span>
             {draft.guests && <span className="text-[10px] bg-navy-50 text-navy-800 px-2 py-0.5 rounded font-bold">{draft.guests} Guests</span>}
          </div>
          <div className="text-navy-900 font-serif font-bold leading-tight">
            {draft.roomType || "Selection pending..."}
          </div>
          {draft.specialRequests && (
            <div className="mt-2 text-[10px] text-gold-700 italic border-t border-stone-100 pt-1">
              "{draft.specialRequests}"
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="pt-4 border-t-2 border-dashed border-stone-200 space-y-2">
          <div className={`flex justify-between text-xs transition-opacity duration-300 ${draft.subtotal ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-stone-500">Subtotal</span>
            <span className="font-mono text-stone-700">${draft.subtotal?.toLocaleString()}</span>
          </div>
          <div className={`flex justify-between text-xs transition-opacity duration-300 ${draft.tax ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-stone-500">Tax (10%)</span>
            <span className="font-mono text-stone-700">${draft.tax?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-end pt-2 mt-2 border-t border-stone-200">
            <span className="font-bold text-navy-900 text-sm">TOTAL</span>
            <div className={`font-serif font-bold text-2xl text-gold-600 transition-all duration-500 ${draft.total ? 'opacity-100 scale-100' : 'opacity-30 scale-90'}`}>
                ${draft.total?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-white border-t border-stone-200">
        {draft.status === 'confirmed' ? (
          <button disabled className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2">
            <span>✓</span> Confirmed
          </button>
        ) : (
          <button disabled className="w-full bg-navy-900 text-white font-bold py-3 rounded-xl shadow-lg opacity-90 flex items-center justify-center gap-2 animate-pulse-slow">
             {!draft.email ? "Waiting for email..." : "Listening for confirmation..."}
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveBookingPanel;