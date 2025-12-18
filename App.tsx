import React, { useState } from 'react';
import { InteractionMode, TicketType } from './types';
import VoiceMode from './components/VoiceMode';
import ChatMode from './components/ChatMode';
import Dashboard from './components/Dashboard';

const Logo = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 0L48 24L24 48L0 24L24 0Z" fill="url(#grad1)" />
    <path d="M24 6L42 24L24 42L6 24L24 6Z" fill="#0F172A" />
    <path d="M24 12L36 24L24 36L12 24L24 12Z" fill="url(#grad2)" />
    <defs>
      <linearGradient id="grad1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D5B638" />
        <stop offset="1" stopColor="#9D7F1C" />
      </linearGradient>
      <linearGradient id="grad2" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F5EFCC" />
        <stop offset="1" stopColor="#BFA026" />
      </linearGradient>
    </defs>
  </svg>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.VOICE);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [toast, setToast] = useState<{message: string, visible: boolean} | null>(null);

  const handleTicketCreated = (ticket: TicketType) => {
    setTickets(prev => [ticket, ...prev]);
    
    if (ticket.type === 'MANAGER') {
      setToast({
        message: `Urgent message forwarded for ${ticket.data.guestName}`,
        visible: true
      });
    } else if (ticket.type === 'RESERVATION') {
      setToast({
        message: `Confirmation email sent to ${ticket.data.email}`,
        visible: true
      });
    }

    if (ticket.type === 'MANAGER' || ticket.type === 'RESERVATION') {
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] font-sans text-stone-800 selection:bg-gold-200 selection:text-navy-900 flex flex-col overflow-x-hidden">
      
      {/* Toast Notification */}
      {toast && toast.visible && (
        <div className="fixed top-8 right-8 z-[100] animate-fade-in-up">
           <div className="bg-navy-950 text-white pl-6 pr-8 py-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-5 border-l-4 border-gold-500 relative overflow-hidden backdrop-blur-xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="bg-gold-500 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center text-navy-950 font-black shadow-[0_0_15px_rgba(191,160,38,0.5)]">✓</div>
             <div>
               <h4 className="font-serif font-bold text-gold-100 text-xl leading-none mb-1">Success</h4>
               <p className="text-xs text-stone-400 font-medium">{toast.message}</p>
             </div>
           </div>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="relative bg-navy-950 text-white pb-48 lg:pb-56 shadow-2xl"> 
           {/* Background Image with Overlay */}
           <div className="absolute inset-0 z-0 overflow-hidden">
               <img 
                 src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop" 
                 alt="Luxury Hotel Foyer" 
                 className="w-full h-full object-cover opacity-40 scale-110 animate-float"
                 style={{ animationDuration: '40s' }}
               />
               <div className="absolute inset-0 bg-gradient-to-b from-navy-950/95 via-navy-900/80 to-[#FDFCF9]/20"></div>
           </div>

           {/* Navigation / Top Bar */}
           <div className="relative z-10 max-w-7xl mx-auto px-8 py-10 flex justify-between items-center">
               <div className="flex items-center gap-5 group cursor-pointer">
                   <div className="transform group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out">
                     <Logo />
                   </div>
                   <div>
                       <h1 className="font-serif text-3xl tracking-[0.2em] font-black text-gold-100 leading-none">GRAND HORIZON</h1>
                       <div className="flex items-center gap-3 mt-2">
                           <div className="h-[1px] w-8 bg-gold-500/50"></div>
                           <p className="text-[9px] uppercase font-black tracking-[0.4em] text-gold-400">Palace & Resorts</p>
                       </div>
                   </div>
               </div>
               
               <div className="hidden lg:flex items-center gap-10 text-[10px] font-black tracking-[0.3em] uppercase text-stone-300">
                    {['Residences', 'Gastronomy', 'Wellness', 'Experiences', 'Inquiry'].map((item) => (
                      <span key={item} className="hover:text-gold-400 cursor-pointer transition-all relative group py-2">
                        {item}
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold-500 transition-all duration-500 group-hover:w-full"></span>
                      </span>
                    ))}
                    <div className="ml-6 px-8 py-3 bg-gold-500/10 border border-gold-500/50 rounded-full text-gold-400 hover:bg-gold-500 hover:text-navy-950 font-bold transition-all cursor-pointer shadow-lg shadow-gold-500/5">
                      Check Rates
                    </div>
               </div>
           </div>

           {/* Welcome Message */}
           <div className="relative z-10 max-w-7xl mx-auto px-8 mt-16 lg:mt-24 flex flex-col lg:row items-center lg:items-end justify-between gap-12 text-center lg:text-left">
               <div className="max-w-3xl">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-[10px] font-black uppercase tracking-widest mb-6">
                      <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse"></span>
                      Now Online: AI Concierge v3.0
                   </div>
                   <h2 className="font-serif text-5xl lg:text-7xl font-bold text-white mb-8 leading-[1.1] drop-shadow-2xl">
                       Refined Hospitality, <br />
                       <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-100 to-gold-500">
                           Instantly Realized.
                       </span>
                   </h2>
                   <p className="text-stone-300 text-xl font-light leading-relaxed border-l-2 lg:border-l-4 border-gold-500 pl-8 max-w-xl">
                       Experience seamless luxury. Our multilingual AI agent handles everything from suite bookings to bespoke requests, in real-time.
                   </p>
               </div>
               
               {/* Mode Switcher */}
               <div className="flex bg-navy-900/40 backdrop-blur-2xl p-2 rounded-3xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                  <button
                    onClick={() => setMode(InteractionMode.VOICE)}
                    className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 ${
                      mode === InteractionMode.VOICE 
                        ? 'bg-gold-500 text-navy-950 shadow-2xl scale-100' 
                        : 'text-stone-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl">🎙</span> Voice Agent
                  </button>
                  <button
                    onClick={() => setMode(InteractionMode.CHAT)}
                    className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 ${
                      mode === InteractionMode.CHAT 
                        ? 'bg-gold-500 text-navy-950 shadow-2xl scale-100' 
                        : 'text-stone-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl">💬</span> Text Concierge
                  </button>
               </div>
           </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 -mt-32 lg:-mt-40 relative z-20 pb-20">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Interaction Panel */}
              <div className="lg:col-span-8 flex flex-col">
                  <div className="flex-1 min-h-[700px] bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-stone-100 relative">
                      {mode === InteractionMode.VOICE ? (
                        <VoiceMode onTicketCreated={handleTicketCreated} />
                      ) : (
                        <ChatMode onTicketCreated={handleTicketCreated} />
                      )}
                  </div>
              </div>

              {/* Feed Panel */}
              <div className="lg:col-span-4 h-full">
                  <div className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-stone-100 h-[600px] lg:h-[700px] overflow-hidden">
                      <Dashboard tickets={tickets} />
                  </div>
              </div>
           </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-navy-950 text-stone-500 py-16 border-t border-white/5 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
               <Logo />
               <div>
                 <p className="font-serif text-white font-bold tracking-widest uppercase">Grand Horizon</p>
                 <p className="text-[10px] font-mono">The Art of Living Well</p>
               </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em]">
              &copy; {new Date().getFullYear()} AI Concierge System • Professional Hospitality Protocol
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;