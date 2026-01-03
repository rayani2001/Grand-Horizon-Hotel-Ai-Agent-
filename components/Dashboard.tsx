import React, { useState, useEffect } from 'react';
import { TicketType, EmailTicket } from '../types';

interface DashboardProps {
  tickets: TicketType[];
}

const Dashboard: React.FC<DashboardProps> = ({ tickets }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'mailbox'>('logs');
  const [selectedEmail, setSelectedEmail] = useState<EmailTicket | null>(null);
  const [showArrivalAnim, setShowArrivalAnim] = useState(false);

  const emails = tickets
    .filter(t => t.type === 'EMAIL_DISPATCH')
    .map(t => t.data as EmailTicket);

  // Trigger arrival animation when new mail comes in
  useEffect(() => {
    if (emails.length > 0) {
      setShowArrivalAnim(true);
      const timer = setTimeout(() => setShowArrivalAnim(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [emails.length]);

  const unreadCount = emails.length;

  return (
    <div className="h-full flex flex-col bg-[#F8F5F2] rounded-[3rem] shadow-2xl border border-stone-200 overflow-hidden relative">
      
      {/* New Mail Arrival Animation Overlay */}
      {showArrivalAnim && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-gold-500 w-24 h-16 rounded-sm shadow-2xl animate-float flex items-center justify-center border-2 border-gold-600 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full border-[12px] border-transparent border-t-gold-600/20"></div>
            <span className="text-navy-950 text-xl font-black">⚜</span>
          </div>
        </div>
      )}

      {/* Luxury Tabs */}
      <div className="flex bg-navy-950 p-2 border-b border-navy-900 shadow-xl relative z-10">
        <button 
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-[2rem] transition-all duration-500 ${activeTab === 'logs' ? 'bg-white text-navy-900 shadow-inner' : 'text-stone-500 hover:text-gold-400'}`}
        >
          Concierge Logs
        </button>
        <button 
          onClick={() => { setActiveTab('mailbox'); setSelectedEmail(null); }}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-[2rem] transition-all duration-500 relative ${activeTab === 'mailbox' ? 'bg-white text-navy-900 shadow-inner' : 'text-stone-500 hover:text-gold-400'}`}
        >
          Physical Mailbox
          {unreadCount > 0 && (
            <span className="absolute top-3 right-6 w-5 h-5 bg-gold-500 text-navy-950 rounded-full flex items-center justify-center text-[8px] font-black animate-pulse shadow-lg">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {activeTab === 'logs' ? (
          <div className="p-10 space-y-10">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-20">
                <span className="text-7xl mb-6">⚜</span>
                <p className="font-serif italic text-2xl">Awaiting Inquiry</p>
              </div>
            ) : (
              tickets.map((ticket, idx) => (
                <div key={idx} className="flex gap-6 animate-fade-in-up">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xs font-black shadow-lg border-4 border-white ${
                    ticket.type === 'MANAGER' ? 'bg-red-600 text-white' : 
                    ticket.type === 'RESERVATION' ? 'bg-navy-950 text-gold-500' : 
                    ticket.type === 'EMAIL_DISPATCH' ? 'bg-gold-500 text-navy-950' : 'bg-white text-navy-950'
                  }`}>
                    {ticket.type[0]}
                  </div>
                  <div className="flex-1 bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gold-600">{ticket.type.replace('_', ' ')}</span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-200"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-200"></div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-navy-950 leading-tight">
                      {ticket.type === 'RESERVATION' ? `Residency Secured: ${ticket.data.guestName}` :
                       ticket.type === 'EMAIL_DISPATCH' ? `Physical Mail Routed to Room` :
                       ticket.type === 'SERVICE' ? ticket.data.requestType : `Urgent Manager Alert`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full bg-[#E5E1DA] p-8 space-y-6">
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-30">
                <div className="w-32 h-20 border-2 border-stone-400 border-dashed rounded-lg mb-6 flex items-center justify-center text-4xl">✉️</div>
                <p className="font-serif italic text-xl">Your mailbox is empty.</p>
                <p className="text-[9px] uppercase font-black tracking-widest mt-2">Physical Message protocol active</p>
              </div>
            ) : selectedEmail ? (
              <div className="bg-white h-full animate-fade-in flex flex-col shadow-2xl rounded-[2rem] overflow-hidden border border-stone-200 relative">
                {/* Vellum Texture */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none"></div>
                
                <div className="p-8 border-b border-stone-100 flex justify-between items-center relative z-10 bg-[#FDFCF9]">
                  <button onClick={() => setSelectedEmail(null)} className="text-[10px] font-black uppercase tracking-widest text-gold-600 hover:text-navy-950 flex items-center gap-2">
                    ← Close Letter
                  </button>
                  <span className="text-[9px] font-mono text-stone-400">{selectedEmail.timestamp}</span>
                </div>
                
                <div className="p-10 flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-8">
                  <div className="text-center pb-10 border-b border-stone-100">
                    <span className="text-gold-500 text-3xl mb-4 block">⚜</span>
                    <h4 className="font-serif text-3xl font-bold text-navy-900">{selectedEmail.subject}</h4>
                  </div>
                  
                  <div className="font-serif text-lg leading-loose text-stone-700 italic px-4">
                    {selectedEmail.body}
                  </div>
                  
                  <div className="pt-10 flex flex-col items-center">
                    <div className="w-16 h-16 border-2 border-stone-200 rounded-full flex items-center justify-center text-stone-300 mb-4">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=VERIFIED" className="w-10 h-10 grayscale opacity-30" />
                    </div>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-stone-400">Authorized Residency Record</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 text-center mb-8">Recent Correspondence</p>
                {emails.map((email) => (
                  <div 
                    key={email.id} 
                    onClick={() => setSelectedEmail(email)}
                    className="group bg-white p-8 rounded-[1rem] shadow-lg cursor-pointer transition-all hover:-translate-y-2 hover:shadow-2xl border-t-[6px] border-gold-500 relative overflow-hidden"
                  >
                    {/* Wax Seal Decoration */}
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-gold-600/5 rounded-full flex items-center justify-center text-gold-600/20 text-4xl rotate-12">
                      ⚜
                    </div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold-600 mb-1">Incoming Mail</span>
                        <span className="text-lg font-serif font-bold text-navy-950">M. {email.guestName}</span>
                      </div>
                      <span className="bg-navy-950 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg">NEW</span>
                    </div>
                    <p className="text-xs text-stone-500 font-serif italic truncate">{email.subject}</p>
                    <div className="mt-6 pt-4 border-t border-stone-50 flex justify-end">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-500 group-hover:text-navy-950 transition-colors">Open Envelope →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;