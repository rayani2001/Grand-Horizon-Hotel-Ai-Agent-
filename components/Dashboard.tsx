import React from 'react';
import { TicketType } from '../types';

interface DashboardProps {
  tickets: TicketType[];
}

const Dashboard: React.FC<DashboardProps> = ({ tickets }) => {
  return (
    <div className="h-full flex flex-col bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white flex justify-between items-center sticky top-0 z-10">
        <h3 className="text-xl font-serif font-bold text-navy-900 flex items-center gap-3">
          <span className="bg-navy-900 text-gold-400 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md">
             ⚜
          </span>
          Concierge Logs
        </h3>
        <span className="text-[10px] font-bold tracking-widest uppercase text-gold-600 bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
          Live Feed
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-stone-50 relative">
        {/* Decorative Timeline Line */}
        {tickets.length > 0 && (
          <div className="absolute left-10 top-6 bottom-6 w-0.5 bg-stone-200 z-0"></div>
        )}

        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 opacity-60">
            <div className="w-16 h-16 border-2 border-stone-300 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📭</span>
            </div>
            <p className="font-serif italic text-lg">No active requests</p>
            <span className="text-xs uppercase tracking-widest mt-2">System Ready</span>
          </div>
        ) : (
          <div className="space-y-8 relative z-10">
            {tickets.map((ticket, idx) => (
              <div key={idx} className="flex gap-4 animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                
                {/* Timeline Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-4 border-stone-50 shadow-sm flex items-center justify-center z-10 mt-1
                  ${ticket.type === 'MANAGER' ? 'bg-red-500 text-white' : 
                    ticket.type === 'RESERVATION' ? 'bg-navy-900 text-gold-400' : 'bg-white text-navy-900 ring-1 ring-stone-200'}">
                   {ticket.type === 'MANAGER' && '!'}
                   {ticket.type === 'RESERVATION' && 'R'}
                   {ticket.type === 'SERVICE' && 'S'}
                </div>

                {/* Card */}
                <div className={`flex-1 rounded-2xl shadow-sm border p-5 transition-all hover:shadow-md ${
                  ticket.type === 'MANAGER' 
                    ? 'bg-red-50 border-red-100' 
                    : 'bg-white border-stone-100'
                }`}>
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${
                       ticket.type === 'MANAGER' ? 'text-red-600' : 'text-stone-400'
                     }`}>
                       {ticket.type === 'MANAGER' ? 'Urgent Priority' : ticket.type}
                     </span>
                     <span className="text-[10px] text-stone-400 font-mono">
                       {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
                  
                  {ticket.type === 'RESERVATION' && (
                    <div className="group">
                       <h4 className="font-serif font-bold text-navy-900 text-xl mb-1 group-hover:text-gold-600 transition-colors">
                         {ticket.data.guestName}
                       </h4>
                       <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-3 text-sm text-stone-600">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-stone-400 font-bold">Check In</span>
                            <span className="font-semibold text-navy-800">{ticket.data.checkIn}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-stone-400 font-bold">Check Out</span>
                            <span className="font-semibold text-navy-800">{ticket.data.checkOut}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-stone-100 mt-1">
                             <span className="px-2 py-0.5 bg-navy-50 text-navy-800 rounded text-xs font-semibold">
                               {ticket.data.roomType}
                             </span>
                             <span className="text-xs text-stone-500">
                               {ticket.data.guests} Guest(s)
                             </span>
                          </div>
                       </div>
                       {ticket.data.specialRequests && (
                         <div className="mt-3 bg-gold-50/50 p-2 rounded-lg text-xs text-gold-800 border border-gold-100 italic">
                           " {ticket.data.specialRequests} "
                         </div>
                       )}
                       <div className="mt-3 flex justify-end">
                         <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-2 py-1 rounded">
                           #{ticket.data.confirmationCode}
                         </span>
                       </div>
                    </div>
                  )}

                  {ticket.type === 'SERVICE' && (
                    <div>
                      <h4 className="font-serif font-bold text-navy-900 text-lg">{ticket.data.requestType}</h4>
                      <div className="flex items-center gap-2 mt-1 mb-3">
                        <span className="text-xs font-semibold text-navy-700">{ticket.data.guestName}</span>
                        {ticket.data.roomNumber && (
                          <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded text-stone-500 font-bold">
                            Rm {ticket.data.roomNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-stone-700 bg-stone-50 p-3 rounded-lg border border-stone-100">
                        {ticket.data.details}
                      </div>
                    </div>
                  )}

                  {ticket.type === 'MANAGER' && (
                    <div className="relative">
                       <div className="flex gap-3 mb-3">
                         <div className="flex-1">
                            <p className="font-bold text-navy-900 text-lg">{ticket.data.guestName}</p>
                            {ticket.data.contactDetails ? (
                              <div className="flex items-center gap-1 text-red-700 mt-1">
                                <span>📞</span>
                                <span className="font-mono font-bold">{ticket.data.contactDetails}</span>
                              </div>
                            ) : (
                               <p className="text-xs text-red-400 italic mt-1">Contact info missing</p>
                            )}
                         </div>
                         <div className={`h-fit px-3 py-1 rounded-lg text-[10px] uppercase font-bold text-white shadow-sm ${
                           ticket.data.urgency === 'high' ? 'bg-red-600 animate-pulse' : 
                           ticket.data.urgency === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                         }`}>
                           {ticket.data.urgency}
                         </div>
                       </div>
                       
                       <div className="bg-white p-4 rounded-xl shadow-inner text-sm text-stone-800 italic border-l-2 border-red-200">
                          "{ticket.data.issue}"
                       </div>
                       <div className="mt-3 flex justify-between items-center text-[10px]">
                          <span className="text-red-500 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                            Live Escalation
                          </span>
                          <span className="text-stone-400">Auto-Forwarded to Pager</span>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;