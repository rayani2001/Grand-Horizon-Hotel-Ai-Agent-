import React from 'react';
import { DraftBooking } from '../types';

interface LiveBookingPanelProps {
  draft: DraftBooking;
}

const LiveBookingPanel: React.FC<LiveBookingPanelProps> = ({ draft }) => {
  return (
    <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden flex flex-col animate-fade-in-up transform transition-all">
      {/* Receipt Header */}
      <div className="bg-navy-900 p-6 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300"></div>
        <div className="relative z-10">
            <h3 className="font-serif font-bold tracking-[0.2em] text-gold-100 uppercase text-xs mb-1">Reservation Summary</h3>
            <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                Ref: {draft.bookingId || 'PENDING SYNC'}
            </p>
        </div>
        {/* Syncing Indicator */}
        <div className="absolute top-4 right-4">
           <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(213,182,56,0.8)]"></div>
        </div>
      </div>

      <div className="p-8 space-y-6 flex-1 bg-stone-50 relative overflow-y-auto">
        {/* Background Paper Texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none"></div>

        {/* Guest Name & Email */}
        <div className={`transition-all duration-700 ${draft.guestName ? 'opacity-100 translate-x-0' : 'opacity-30'}`}>
          <label className="text-[9px] uppercase font-black text-stone-400 block mb-2 tracking-tighter">Guest Information</label>
          <div className="text-xl font-serif font-bold text-navy-900 border-b-2 border-stone-200 pb-2 leading-tight flex items-baseline gap-2">
            <span className="text-gold-600 text-sm italic">M.</span> {draft.guestName || "Guest Name"}
          </div>
          {draft.email && (
            <div className="text-[10px] text-stone-500 mt-2 font-mono bg-white px-2 py-1 rounded border border-stone-200 inline-block">
              {draft.email}
            </div>
          )}
        </div>

        {/* Stay Dates */}
        <div className="grid grid-cols-2 gap-6">
          <div className={`transition-all duration-700 delay-100 ${draft.checkIn ? 'opacity-100' : 'opacity-30'}`}>
            <label className="text-[9px] uppercase font-black text-stone-400 block mb-1 tracking-tighter">Check-in</label>
            <div className="font-bold text-navy-900 text-sm flex items-center gap-2">
               <span className="text-gold-500">🗓</span> {draft.checkIn || "—"}
            </div>
          </div>
          <div className={`transition-all duration-700 delay-200 ${draft.checkOut ? 'opacity-100' : 'opacity-30'}`}>
            <label className="text-[9px] uppercase font-black text-stone-400 block mb-1 tracking-tighter">Check-out</label>
            <div className="font-bold text-navy-900 text-sm flex items-center gap-2">
               <span className="text-gold-500">🗓</span> {draft.checkOut || "—"}
            </div>
          </div>
        </div>

        {/* Room Selection */}
        <div className={`bg-white p-4 rounded-xl border border-stone-200 shadow-sm transition-all duration-700 delay-300 ${draft.roomType ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}`}>
          <div className="flex justify-between items-center mb-2">
             <span className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">Room Configuration</span>
             {draft.guests && (
                <span className="text-[9px] bg-gold-100 text-gold-800 px-2 py-1 rounded-full font-bold uppercase">
                  {draft.guests} People
                </span>
             )}
          </div>
          <div className="text-navy-950 font-serif font-bold text-lg leading-none">
            {draft.roomType || "Reviewing rooms..."}
          </div>
          {draft.specialRequests && (
            <div className="mt-3 text-[10px] text-stone-500 italic border-t border-stone-100 pt-2 leading-relaxed">
              " {draft.specialRequests} "
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="pt-6 border-t-2 border-dashed border-stone-300 space-y-3">
          <div className={`flex justify-between text-[11px] transition-opacity duration-500 ${draft.subtotal ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-stone-400 uppercase font-bold">Base Rate</span>
            <span className="font-mono font-bold text-stone-700 tracking-tighter">${draft.subtotal?.toLocaleString()}</span>
          </div>
          <div className={`flex justify-between text-[11px] transition-opacity duration-500 ${draft.tax ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-stone-400 uppercase font-bold">Taxes & Fees (10%)</span>
            <span className="font-mono font-bold text-stone-700 tracking-tighter">${draft.tax?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-4 mt-2 border-t border-stone-300">
            <span className="font-black text-navy-900 text-[10px] uppercase tracking-[0.2em]">Total Est.</span>
            <div className={`font-serif font-bold text-3xl text-gold-600 transition-all duration-700 ${draft.total ? 'opacity-100 scale-100' : 'opacity-20 scale-90'}`}>
                ${draft.total?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-white border-t border-stone-200">
        {draft.status === 'confirmed' ? (
          <div className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 animate-fade-in-up">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">✓</div>
            <span className="uppercase tracking-widest text-xs">Booking Confirmed</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="w-full bg-navy-950 text-white py-4 px-6 rounded-xl shadow-xl flex items-center justify-between group overflow-hidden relative">
               <div className="absolute inset-0 bg-gold-500/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
               <div className="flex flex-col relative z-10">
                 <span className="text-[8px] uppercase font-bold text-stone-400 tracking-[0.2em] mb-1">Status</span>
                 <span className="text-xs font-bold tracking-wide">
                   {!draft.email ? "Gathering Info..." : "Waiting for Guest Final Word..."}
                 </span>
               </div>
               <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse relative z-10"></div>
            </div>
            <p className="text-[9px] text-center text-stone-400 uppercase tracking-widest font-medium">Listening for confirmation...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveBookingPanel;