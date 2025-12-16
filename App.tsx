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
    
    // Show toast based on Ticket Type
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
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 selection:bg-gold-200 selection:text-navy-900 flex flex-col overflow-x-hidden">
      
      {/* Toast Notification */}
      {toast && toast.visible && (
        <div className="fixed top-8 right-8 z-50 animate-fade-in-up">
           <div className="bg-navy-900 text-white pl-6 pr-8 py-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex items-center gap-4 border-l-4 border-gold-500 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="bg-gradient-to-br from-gold-400 to-gold-600 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center text-navy-900 font-bold shadow-md">✓</div>
             <div>
               <h4 className="font-serif font-bold text-gold-100 text-lg">Sent Successfully</h4>
               <p className="text-xs text-stone-300 font-light">{toast.message}</p>
             </div>
           </div>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="relative bg-navy-950 text-white pb-32 lg:pb-40 shadow-2xl"> 
           {/* Background Image with Overlay */}
           <div className="absolute inset-0 z-0 overflow-hidden">
               <img 
                 src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop" 
                 alt="Luxury Hotel Background" 
                 className="w-full h-full object-cover opacity-30 scale-105 animate-float"
                 style={{ animationDuration: '60s' }}
               />
               <div className="absolute inset-0 bg-gradient-to-b from-navy-950/90 via-navy-900/80 to-stone-100/5"></div>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
           </div>

           {/* Navigation / Top Bar */}
           <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
               <div className="flex items-center gap-4 group cursor-pointer">
                   <div className="transform group-hover:rotate-180 transition-transform duration-700">
                     <Logo />
                   </div>
                   <div>
                       <h1 className="font-serif text-2xl tracking-widest font-bold text-gold-100 leading-none">GRAND HORIZON</h1>
                       <div className="flex items-center gap-2 mt-1">
                           <div className="h-[1px] w-6 bg-gold-500"></div>
                           <p className="text-[10px] uppercase tracking-[0.3em] text-gold-400 font-medium">Luxury Hotel & Spa</p>
                       </div>
                   </div>
               </div>
               <div className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest uppercase text-stone-300">
                    {['Suites', 'Dining', 'Spa', 'Events', 'Contact'].map((item) => (
                      <span key={item} className="hover:text-gold-400 cursor-pointer transition-colors relative group">
                        {item}
                        <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full"></span>
                      </span>
                    ))}
                    <div className="ml-4 px-4 py-2 border border-gold-500/50 rounded-full text-gold-400 hover:bg-gold-500 hover:text-navy-900 transition-all cursor-pointer">
                      Book Now
                    </div>
               </div>
           </div>

           {/* Welcome Message */}
           <div className="relative z-10 max-w-7xl mx-auto px-6 mt-12 md:mt-20 mb-8 flex flex-col md:flex-row items-end justify-between gap-8">
               <div className="max-w-2xl">
                   <h2 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                       Elegance Redefined. <br />
                       <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-200 to-gold-500 animate-pulse-slow">
                           At Your Service.
                       </span>
                   </h2>
                   <p className="text-stone-300 text-lg font-light leading-relaxed border-l-2 border-gold-500 pl-6">
                       Welcome to Grand Horizon. Our AI Concierge is standing by to curate your perfect stay, handle reservations, and fulfill your every request instantly.
                   </p>
               </div>
               
               {/* Mode Switcher (Moved here for better integration) */}
               <div className="flex bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg">
                  <button
                    onClick={() => setMode(InteractionMode.VOICE)}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                      mode === InteractionMode.VOICE 
                        ? 'bg-gold-500 text-navy-900 shadow-lg scale-100' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">🎙️</span> Voice Reception
                  </button>
                  <button
                    onClick={() => setMode(InteractionMode.CHAT)}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                      mode === InteractionMode.CHAT 
                        ? 'bg-gold-500 text-navy-900 shadow-lg scale-100' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">💬</span> Text Concierge
                  </button>
               </div>
           </div>
      </div>

      {/* Main Content Card - Floating up over the hero */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 -mt-24 relative z-20 pb-12">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Panel: AI Interaction */}
              <div className="lg:col-span-7 flex flex-col">
                  <div className="flex-1 min-h-[650px] bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-stone-100 relative">
                      {mode === InteractionMode.VOICE ? (
                        <VoiceMode onTicketCreated={handleTicketCreated} />
                      ) : (
                        <ChatMode onTicketCreated={handleTicketCreated} />
                      )}
                  </div>
              </div>

              {/* Right Panel: Live Dashboard */}
              <div className="lg:col-span-5 h-full">
                  <div className="bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-stone-100 h-[500px] lg:h-[650px] overflow-hidden">
                      <Dashboard tickets={tickets} />
                  </div>
              </div>
           </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-8 text-center text-stone-400 text-xs font-mono uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Grand Horizon Hotels & Resorts. AI Concierge System v2.0
      </footer>
    </div>
  );
};

export default App;