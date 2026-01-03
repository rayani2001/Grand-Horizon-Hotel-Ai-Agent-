import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { MODEL_CHAT, SYSTEM_INSTRUCTION, TOOLS } from '../constants';
import { TicketType, ChatMessage, DraftBooking, EmailTicket } from '../types';
import LiveBookingPanel from './LiveBookingPanel';

interface ChatModeProps {
  onTicketCreated: (ticket: TicketType) => void;
}

const ChatMode: React.FC<ChatModeProps> = ({ onTicketCreated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: `Hello! Welcome to Grand Horizon Hotel. How may I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<DraftBooking | null>(null);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatSessionRef.current = ai.chats.create({
        model: MODEL_CHAT,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: TOOLS }]
        }
      });
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  };

  useEffect(() => {
    initChat();
  }, []);

  const handleReset = () => {
    chatSessionRef.current = null;
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: `Hello! Welcome to Grand Horizon Hotel. How may I assist you today?`,
        timestamp: new Date()
      }
    ]);
    setDraft(null);
    setInput('');
    setIsLoading(false);
    initChat();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) initChat();
      
      const result = await chatSessionRef.current!.sendMessage({ message: userMsg.text });
      
      const calls = result.functionCalls;
      if (calls && calls.length > 0) {
        const parts = await Promise.all(calls.map(async (call) => {
           const args = call.args as any;
           let responseContent: any = { result: 'Processed.' };

           if (call.name === 'updateBookingDraft') {
              setDraft(prev => ({
                ...prev,
                status: 'active',
                bookingId: prev?.bookingId || `BK-${Math.floor(10000 + Math.random() * 90000)}`,
                guestName: args.guestName ?? prev?.guestName,
                email: args.email ?? prev?.email,
                checkIn: args.checkIn ?? prev?.checkIn,
                checkOut: args.checkOut ?? prev?.checkOut,
                roomType: args.roomType ?? prev?.roomType,
                guests: args.guests ?? prev?.guests,
                specialRequests: args.specialRequests ?? prev?.specialRequests,
                subtotal: args.subtotal ?? prev?.subtotal,
                tax: args.tax ?? prev?.tax,
                total: args.total ?? prev?.total,
              }));
           } else if (call.name === 'sendEmailConfirmation') {
              setDraft(prev => prev ? { ...prev, emailStatus: 'sending' } : null);
              await new Promise(r => setTimeout(r, 1500));
              
              const newEmail: EmailTicket = {
                id: Date.now().toString(),
                email: args.email,
                guestName: args.guestName || 'Valued Guest',
                subject: `Booking Confirmed: ${draft?.bookingId || 'Horizon Palace'}`,
                body: `Dear ${args.guestName},\n\nThis is your official physical record for your stay at Grand Horizon.\n\nDetails:\n${args.bookingDetails || 'Summer Getaway Package'}\n\nWe look forward to welcoming you.\n\nBest Regards,\nHorizon Concierge`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isRead: false
              };
              onTicketCreated({ type: 'EMAIL_DISPATCH', data: newEmail });
              setDraft(prev => prev ? { ...prev, emailStatus: 'sent' } : null);
              responseContent = { result: { status: 'sent' } };

           } else if (call.name === 'saveReservation') {
             onTicketCreated({
               type: 'RESERVATION',
               data: { ...args, confirmationCode: Math.random().toString(36).substring(7).toUpperCase() }
             });
             setDraft(prev => prev ? { ...prev, status: 'confirmed' } : null);
           } else if (call.name === 'saveServiceRequest') {
             onTicketCreated({
               type: 'SERVICE',
               data: { ...args, timestamp: new Date().toLocaleTimeString() }
             });
           } else if (call.name === 'createManagerMessage') {
             onTicketCreated({
               type: 'MANAGER',
               data: { ...args, timestamp: new Date().toLocaleTimeString() }
             });
           }

           return {
             functionResponse: {
               id: call.id,
               name: call.name,
               response: responseContent
             }
           };
        }));

        const finalResult = await chatSessionRef.current!.sendMessage({ 
          message: parts 
        });
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: finalResult.text || "Request processed.",
          timestamp: new Date()
        }]);

      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: result.text || "",
          timestamp: new Date()
        }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I apologize, but I'm having trouble connecting to the hotel system. Please refresh to restart the chat.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full bg-navy-950 overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dark Header */}
        <div className="bg-navy-900 p-5 border-b border-navy-800 flex justify-between items-center shadow-lg z-10">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse shadow-[0_0_8px_rgba(213,182,56,0.5)]"></div>
             <div>
               <span className="font-serif font-bold text-white block text-lg leading-none">Concierge Messenger</span>
               <span className="text-[10px] text-gold-500 uppercase tracking-wider font-black">Private Channel Active</span>
             </div>
          </div>
          <button onClick={handleReset} className="text-stone-500 hover:text-gold-400 transition-colors p-2 rounded-full hover:bg-navy-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Message area with dark background */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-navy-950 relative">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up relative z-10`}>
              <div className={`max-w-[85%] rounded-[2rem] px-6 py-4 text-sm leading-relaxed shadow-2xl ${
                msg.role === 'user' 
                  ? 'bg-gold-500 text-navy-950 font-bold rounded-br-sm' 
                  : 'bg-navy-800 text-stone-100 border border-navy-700 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>
              <span className={`text-[9px] mt-2 px-2 uppercase tracking-widest font-black ${
                msg.role === 'user' ? 'text-gold-600' : 'text-stone-500'
              }`}>
                 {msg.role === 'user' ? 'Guest' : 'Grand Horizon'} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start animate-pulse relative z-10">
               <div className="bg-navy-800 px-5 py-3 rounded-full border border-navy-700 shadow-xl flex gap-1.5 items-center">
                 <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                 <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Dark Input area */}
        <div className="p-6 bg-navy-900 border-t border-navy-800">
          <div className="relative flex items-center shadow-inner rounded-full overflow-hidden border border-navy-700 focus-within:ring-2 focus-within:ring-gold-500/50 transition-all p-1 bg-navy-950">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Speak with the concierge..."
              className="flex-1 px-6 py-3 bg-transparent focus:outline-none text-white placeholder-stone-600 text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gold-500 hover:bg-white disabled:bg-navy-800 text-navy-950 w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-xl active:scale-95 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {draft && (
        <div className="w-[400px] border-l border-navy-800 bg-white p-4 overflow-y-auto hidden xl:block animate-fade-in shadow-[-20px_0_50px_rgba(0,0,0,0.3)] z-20">
           <LiveBookingPanel draft={draft} />
        </div>
      )}
    </div>
  );
};

export default ChatMode;