import React, { useState, useEffect } from 'react';
import { InteractionMode, TicketType, EmailTicket } from './types';
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

const MailDeliveryOverlay = ({ email, onComplete }: { email: EmailTicket, onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none">
      <div className="relative animate-float scale-150">
        <div className="w-64 h-40 bg-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-t-[8px] border-gold-500 rounded-sm flex flex-col items-center justify-center p-6 animate-fade-in-up">
           <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-600 text-2xl mb-3">⚜</div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-navy-950">Physical Record Delivered</p>
           <p className="text-[8px] text-stone-400 mt-2 font-serif italic">Check your Physical Mailbox</p>
        </div>
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse">1</div>
      </div>
    </div>
  );
};

const SectionHeading = ({ subtitle, title, light = false }: { subtitle: string, title: string, light?: boolean }) => (
  <div className="text-center mb-16 space-y-4">
    <span className={`text-[11px] uppercase font-black tracking-[0.4em] ${light ? 'text-gold-400' : 'text-gold-600'}`}>{subtitle}</span>
    <h2 className={`font-serif text-5xl md:text-7xl font-bold tracking-tight ${light ? 'text-white' : 'text-navy-950'}`}>{title}</h2>
    <div className={`w-24 h-1 mx-auto mt-8 ${light ? 'bg-gold-500/30' : 'bg-gold-500/20'}`}></div>
  </div>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.VOICE);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [toast, setToast] = useState<{message: string, visible: boolean} | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [deliveredMail, setDeliveredMail] = useState<EmailTicket | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTicketCreated = (ticket: TicketType) => {
    setTickets(prev => [ticket, ...prev]);
    if (ticket.type === 'EMAIL_DISPATCH') {
      setDeliveredMail(ticket.data);
    }
    if (ticket.type === 'RESERVATION' || ticket.type === 'EMAIL_DISPATCH') {
      const msg = ticket.type === 'RESERVATION' ? `Reservation Secured: ${ticket.data.guestName}` : `Physical Correspondence Dispatched`;
      setToast({ message: msg, visible: true });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const scrollToConcierge = () => {
    document.getElementById('ai-concierge')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50 overflow-x-hidden">
      
      {deliveredMail && (
        <MailDeliveryOverlay email={deliveredMail} onComplete={() => setDeliveredMail(null)} />
      )}

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 px-8 py-6 flex justify-between items-center ${scrolled ? 'bg-navy-950/95 backdrop-blur-xl shadow-2xl py-4' : 'bg-transparent'}`}>
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Logo />
          <div className="hidden sm:block">
            <h1 className="font-serif text-2xl tracking-[0.2em] font-black text-white leading-none">GRAND HORIZON</h1>
            <p className="text-[9px] uppercase font-black tracking-[0.4em] text-gold-500 mt-1">Palace & Resorts</p>
          </div>
        </div>
        <div className="flex items-center gap-8 md:gap-12">
          <div className="hidden lg:flex items-center gap-8 text-[10px] font-black tracking-[0.3em] uppercase text-stone-300">
            {['Residences', 'Facilities', 'Gastronomy', 'Concierge'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-gold-400 transition-colors">{item}</a>
            ))}
          </div>
          <button onClick={scrollToConcierge} className="px-8 py-3 bg-gold-500 text-navy-950 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-white hover:scale-105 transition-all shadow-lg shadow-gold-500/20 active:scale-95">
            Book Now
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070" 
            className="w-full h-full object-cover scale-105 animate-float"
            alt="Luxury Lobby"
          />
          <div className="absolute inset-0 luxury-overlay"></div>
        </div>
        <div className="relative z-10 text-center px-6 max-w-5xl animate-slide-up">
          <span className="text-gold-400 text-[12px] font-black uppercase tracking-[0.6em] mb-8 block">Experience Timeless Elegance</span>
          <h2 className="font-serif text-7xl md:text-9xl font-bold text-white mb-10 leading-[0.9]">
            The New Standard of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 via-gold-100 to-gold-400 italic font-normal">Hospitality.</span>
          </h2>
          <div className="flex flex-col md:row items-center justify-center gap-6 mt-12">
            <button onClick={scrollToConcierge} className="px-12 py-5 bg-gold-500 text-navy-950 font-black rounded-full text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-white transition-all">Start Reservation</button>
            <a href="#residences" className="px-12 py-5 border border-white/30 text-white rounded-full text-xs font-black uppercase tracking-[0.3em] hover:bg-white/10 backdrop-blur-md transition-all">Explore Residences</a>
          </div>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce text-white/40 text-2xl">↓</div>
      </section>

      {/* Residences Section */}
      <section id="residences" className="py-32 px-8 max-w-[1600px] mx-auto">
        <SectionHeading subtitle="Signature Collection" title="Grand Residences" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {[
            { name: 'Imperial Sky Villa', desc: 'Penthouse exclusivity with private pool and 360° views.', price: '$1,500', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070' },
            { name: 'Azure Ocean Suite', desc: 'Direct oceanfront luxury with a bespoke marble terrace.', price: '$950', img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974' },
            { name: 'Zen Garden Sanctuary', desc: 'Tranquil garden retreat with private meditation pavilion.', price: '$700', img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1974' }
          ].map((r, i) => (
            <div key={i} className="group relative h-[600px] rounded-[3rem] overflow-hidden cursor-pointer shadow-2xl">
              <img src={r.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" alt={r.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/10 to-transparent p-12 flex flex-col justify-end">
                <span className="text-gold-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">Luxury Class</span>
                <h4 className="text-white font-serif text-4xl font-bold mb-4">{r.name}</h4>
                <p className="text-stone-300 text-sm font-light mb-8 opacity-0 group-hover:opacity-100 transition-all duration-700">{r.desc}</p>
                <div className="flex justify-between items-center pt-8 border-t border-white/20">
                  <span className="text-white text-2xl font-bold tracking-tighter">{r.price}<span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest ml-2">/ night</span></span>
                  <button onClick={scrollToConcierge} className="px-6 py-3 bg-white text-navy-950 rounded-full text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-xl">Book Now</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Facilities Section */}
      <section id="facilities" className="py-32 bg-navy-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-[1400px] mx-auto px-8 relative z-10">
          <SectionHeading subtitle="World Class Amenities" title="The Palace Experience" light />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Thermal Spa', icon: '🌊', desc: 'Healing mineral baths' },
              { label: 'Private Yacht', icon: '⚓', desc: 'Sunset excursions' },
              { label: 'Michelin Dining', icon: '🍽️', desc: 'Gastronomic excellence' },
              { label: 'Smart Butler', icon: '🤖', desc: '24/7 AI Concierge' }
            ].map((f, i) => (
              <div key={i} className="text-center group">
                <div className="w-24 h-24 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-6 group-hover:bg-gold-500 group-hover:text-navy-950 transition-all duration-500 group-hover:-translate-y-2">
                  {f.icon}
                </div>
                <h5 className="text-white font-serif text-2xl mb-2">{f.label}</h5>
                <p className="text-stone-500 text-xs uppercase tracking-widest">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Concierge Hub */}
      <section id="concierge" className="py-32 px-8 bg-stone-100 scroll-mt-20">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:row items-center justify-between gap-12 mb-20">
            <div className="max-w-2xl">
              <span className="text-gold-600 font-black text-[11px] uppercase tracking-[0.5em] mb-4 block">Personalized Service</span>
              <h3 className="font-serif text-6xl font-bold text-navy-950 tracking-tight mb-8">Your Virtual Concierge</h3>
              <p className="text-stone-600 text-xl font-light leading-relaxed">Our multilingual AI agent is ready to curate your entire stay. Reserve suites, request services, or manage your itinerary through natural voice or text conversation.</p>
            </div>
            <div className="bg-white p-3 rounded-[3rem] shadow-2xl flex border border-stone-200">
               <button 
                  onClick={() => setMode(InteractionMode.VOICE)}
                  className={`px-10 py-5 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 ${
                    mode === InteractionMode.VOICE ? 'bg-navy-950 text-white shadow-xl' : 'text-stone-400 hover:text-navy-950'
                  }`}
               >
                 🎙 Voice Agent
               </button>
               <button 
                  onClick={() => setMode(InteractionMode.CHAT)}
                  className={`px-10 py-5 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center gap-3 ${
                    mode === InteractionMode.CHAT ? 'bg-navy-950 text-white shadow-xl' : 'text-stone-400 hover:text-navy-950'
                  }`}
               >
                 💬 Text Messenger
               </button>
            </div>
          </div>

          <div id="ai-concierge" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-8">
               <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] overflow-hidden h-[850px] border border-stone-100">
                  {mode === InteractionMode.VOICE ? (
                    <VoiceMode onTicketCreated={handleTicketCreated} />
                  ) : (
                    <ChatMode onTicketCreated={handleTicketCreated} />
                  )}
               </div>
            </div>
            <div className="lg:col-span-4 h-full">
               <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-stone-100 h-[850px] overflow-hidden">
                  <Dashboard tickets={tickets} />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 text-stone-500 py-32 px-12 border-t border-white/5">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <Logo />
              <h2 className="font-serif text-white font-bold tracking-[0.3em] uppercase text-2xl">Grand Horizon</h2>
            </div>
            <p className="font-light leading-relaxed text-sm">Experience the pinnacle of hospitality where tradition meets innovation. Our palace awaits your arrival.</p>
            <div className="flex gap-6 text-white/40 text-sm">
              <span className="hover:text-gold-400 cursor-pointer transition-colors">Instagram</span>
              <span className="hover:text-gold-400 cursor-pointer transition-colors">LinkedIn</span>
            </div>
          </div>
          <div>
            <h5 className="text-white text-[11px] font-black uppercase tracking-[0.4em] mb-10">Resort Navigation</h5>
            <ul className="space-y-6 text-xs font-bold uppercase tracking-widest">
              <li><a href="#" className="hover:text-gold-400">Palace Grounds</a></li>
              <li><a href="#residences" className="hover:text-gold-400">Suites & Residences</a></li>
              <li><a href="#facilities" className="hover:text-gold-400">Gastronomy & Dining</a></li>
              <li><a href="#" className="hover:text-gold-400">Wellness Sanctuary</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white text-[11px] font-black uppercase tracking-[0.4em] mb-10">Guest Services</h5>
            <ul className="space-y-6 text-xs font-bold uppercase tracking-widest">
              <li><button onClick={scrollToConcierge} className="hover:text-gold-400">Digital Concierge</button></li>
              <li><a href="#" className="hover:text-gold-400">Private Aviation</a></li>
              <li><a href="#" className="hover:text-gold-400">Elite Rewards</a></li>
              <li><a href="#" className="hover:text-gold-400">Gift Vouchers</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white text-[11px] font-black uppercase tracking-[0.4em] mb-10">Direct Reach</h5>
            <div className="space-y-6">
              <p className="text-stone-300 font-serif text-2xl">+1 (800) HORIZON-ELITE</p>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">concierge@grandhorizon.com</p>
              <div className="pt-8 text-[9px] uppercase tracking-[0.4em] border-t border-white/10">
                1200 Palace Boulevard, <br />
                Oceanview Enclave, 90210
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.5em] text-stone-600">
          <p>&copy; {new Date().getFullYear()} Horizon Palace & Resorts • AI Protocol v4.0.12</p>
          <div className="flex gap-10">
            <span>Privacy Policy</span>
            <span>Terms of Residency</span>
          </div>
        </div>
      </footer>

      {/* Luxury Toast */}
      {toast && toast.visible && (
        <div className="fixed top-12 right-12 z-[300] animate-fade-in-up">
           <div className="bg-navy-950 text-white pl-8 pr-12 py-6 rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex items-center gap-6 border-l-[6px] border-gold-500 relative overflow-hidden backdrop-blur-3xl">
             <div className="bg-gold-500 rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center text-navy-950 font-black">✓</div>
             <div>
               <h4 className="font-serif font-bold text-gold-100 text-2xl leading-none">System Notification</h4>
               <p className="text-[10px] text-stone-400 mt-2 font-black uppercase tracking-widest">{toast.message}</p>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;