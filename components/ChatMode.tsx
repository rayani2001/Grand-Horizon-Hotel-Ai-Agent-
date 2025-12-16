import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { MODEL_CHAT, SYSTEM_INSTRUCTION, TOOLS } from '../constants';
import { TicketType, ChatMessage, DraftBooking } from '../types';
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
      console.log("Chat session initialized");
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
      
      // Handle Function Calls
      const calls = result.functionCalls;
      if (calls && calls.length > 0) {
        // Map calls to Part objects with functionResponse
        const parts = calls.map(call => {
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
           } else if (call.name === 'saveReservation') {
             const ticket: TicketType = {
               type: 'RESERVATION',
               data: {
                 guestName: args.guestName,
                 email: args.email,
                 checkIn: args.checkIn,
                 checkOut: args.checkOut,
                 guests: args.guests,
                 roomType: args.roomType,
                 specialRequests: args.specialRequests,
                 confirmationCode: Math.random().toString(36).substring(7).toUpperCase()
               }
             };
             onTicketCreated(ticket);
             setDraft(prev => prev ? { ...prev, status: 'confirmed' } : null);
             setTimeout(() => setDraft(null), 5000);
           } else if (call.name === 'saveServiceRequest') {
             const ticket: TicketType = {
               type: 'SERVICE',
               data: {
                 guestName: args.guestName,
                 requestType: args.requestType,
                 details: args.details,
                 roomNumber: args.roomNumber,
                 notes: args.notes,
                 timestamp: new Date().toLocaleTimeString()
               }
             };
             onTicketCreated(ticket);
           } else if (call.name === 'createManagerMessage') {
             const ticket: TicketType = {
               type: 'MANAGER',
               data: {
                 guestName: args.guestName,
                 contactDetails: args.contactDetails,
                 issue: args.issue,
                 urgency: args.urgency,
                 timestamp: new Date().toLocaleTimeString()
               }
             };
             onTicketCreated(ticket);
           } else if (call.name === 'attemptManagerCall') {
             responseContent = { result: { status: 'busy' } };
           }

           return {
             functionResponse: {
               id: call.id,
               name: call.name,
               response: responseContent
             }
           };
        });

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
        text: "I apologize, but I'm having trouble connecting to the hotel system. Please click the refresh button at the top to restart the chat.",
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
    <div className="flex h-full bg-stone-50 rounded-3xl shadow-xl border border-stone-100 overflow-hidden relative">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white p-5 border-b border-stone-100 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <div>
               <span className="font-serif font-bold text-navy-900 block text-lg leading-none">Concierge Chat</span>
               <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Always At Your Service</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={handleReset}
               className="text-stone-400 hover:text-navy-900 transition-colors p-2 rounded-full hover:bg-stone-50"
               title="Restart Conversation"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
             </button>
             <div className="text-2xl text-stone-300">💬</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-6 py-4 text-sm leading-relaxed shadow-sm relative ${
                  msg.role === 'user'
                    ? 'bg-navy-900 text-white rounded-br-sm'
                    : 'bg-white text-stone-700 border border-stone-100 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-stone-400 mt-1 px-1">
                 {msg.role === 'user' ? 'You' : 'Grand Horizon'} • {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start animate-pulse">
               <div className="bg-white px-4 py-3 rounded-2xl border border-stone-100 shadow-sm flex gap-1 items-center">
                 <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                 <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-5 bg-white border-t border-stone-100">
          <div className="relative flex items-center shadow-sm rounded-xl overflow-hidden border border-stone-200 focus-within:ring-2 focus-within:ring-gold-400 focus-within:border-transparent transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your request here..."
              className="flex-1 px-6 py-4 bg-transparent focus:outline-none text-stone-700 placeholder-stone-400"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gold-500 hover:bg-gold-600 disabled:bg-stone-200 disabled:cursor-not-allowed text-white px-8 py-4 font-bold transition-all hover:pr-10"
            >
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Panel Side - Visible if draft exists */}
      {draft && (
        <div className="w-[340px] border-l border-stone-100 bg-stone-50 p-4 overflow-y-auto hidden md:block animate-slide-in">
           <LiveBookingPanel draft={draft} />
        </div>
      )}
    </div>
  );
};

export default ChatMode;