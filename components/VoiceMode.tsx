import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MODEL_VOICE, SYSTEM_INSTRUCTION, TOOLS } from '../constants';
import { TicketType, DraftBooking, ManagerCallStatus } from '../types';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audio';
import Visualizer from './Visualizer';
import LiveBookingPanel from './LiveBookingPanel';
import ManagerCallInterface from './ManagerCallInterface';

interface VoiceModeProps {
  onTicketCreated: (ticket: TicketType) => void;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ onTicketCreated }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [draft, setDraft] = useState<DraftBooking | null>(null);
  const [managerCallStatus, setManagerCallStatus] = useState<ManagerCallStatus>('idle');

  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const stopAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    
    if (inputContextRef.current) {
      inputContextRef.current.close().catch(() => {});
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close().catch(() => {});
      outputContextRef.current = null;
    }
    setIsConnected(false);
    setMicActive(false);
    analyserRef.current = null;
  }, []);

  const handleToolCall = useCallback(async (toolCall: any, session: any) => {
    const functionResponses = [];

    for (const fc of toolCall.functionCalls) {
      const args = fc.args;
      let result = { status: 'success' };
      
      if (fc.name === 'updateBookingDraft') {
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
      } else if (fc.name === 'saveReservation') {
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

      } else if (fc.name === 'attemptManagerCall') {
        setManagerCallStatus('calling');
        await new Promise(resolve => setTimeout(resolve, 3000));
        setManagerCallStatus('busy');
        result = { status: 'busy' }; 

      } else if (fc.name === 'createManagerMessage') {
        setManagerCallStatus('sending_msg');
        await new Promise(resolve => setTimeout(resolve, 2000));

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
        setManagerCallStatus('completed');
        setTimeout(() => setManagerCallStatus('idle'), 3000);

      } else if (fc.name === 'saveServiceRequest') {
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
      }

      functionResponses.push({
        id: fc.id,
        name: fc.name,
        response: { result },
      });
    }

    session.sendToolResponse({ functionResponses });
  }, [onTicketCreated]);

  const startSession = async () => {
    setError(null);
    setDraft(null);
    setManagerCallStatus('idle');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputContextRef.current.createGain();
      outputNode.connect(outputContextRef.current.destination);

      const analyser = inputContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      sessionPromiseRef.current = ai.live.connect({
        model: MODEL_VOICE,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: TOOLS }],
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setMicActive(true);
            if (!inputContextRef.current || !streamRef.current) return;
            const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
            source.connect(analyser); 
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(processor);
            processor.connect(inputContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && outputContextRef.current) {
                const ctx = outputContextRef.current;
                const buffer = await decodeAudioData(base64ToUint8Array(audioData), ctx);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(outputNode);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
             }
             if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
             }
             if (msg.toolCall) {
                sessionPromiseRef.current?.then(session => handleToolCall(msg.toolCall, session));
             }
          },
          onclose: () => {
            stopAudio();
          },
          onerror: (err) => {
            setError("Session ended. Reconnect to continue.");
            stopAudio();
          }
        }
      });

    } catch (e) {
      setError("Microphone access is required for voice mode.");
      stopAudio();
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const resetAll = () => {
    stopAudio();
    setDraft(null);
    setManagerCallStatus('idle');
    setError(null);
  };

  return (
    <div className="flex h-full bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-gold-100 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-navy-100 rounded-full blur-[100px]"></div>
      </div>

      {/* Mode Status Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
               {isConnected ? 'Active Channel 01' : 'Channel Standby'}
            </span>
         </div>
         {isConnected && (
            <button 
              onClick={resetAll}
              className="text-stone-400 hover:text-navy-950 transition-colors p-2 rounded-full hover:bg-stone-50"
              title="Reset Session"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
            </button>
         )}
      </div>

      <div className="relative z-10 flex w-full h-full items-center justify-center p-8 gap-8 transition-all duration-700">
        
        {/* Voice Hub */}
        <div className={`flex flex-col items-center justify-center space-y-10 transition-all duration-700 ease-in-out 
          ${(draft || managerCallStatus !== 'idle') ? 'w-1/2 items-center pr-8 border-r border-stone-100' : 'w-full'}`}>
          
          <div className="relative">
            {isConnected && (
              <div className="absolute -inset-8 bg-gold-500/10 rounded-full blur-3xl animate-pulse"></div>
            )}

            <div 
              className={`rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 relative overflow-hidden group
                ${isConnected ? 'bg-navy-950 ring-8 ring-gold-500/10 scale-110' : 'bg-white border-2 border-stone-100'}
                ${(draft || managerCallStatus !== 'idle') ? 'w-36 h-36' : 'w-48 h-48'}`} 
            >
               <span className={`transition-all duration-500 z-10 ${isConnected ? 'text-white' : 'text-stone-300 group-hover:text-gold-500'} 
                  ${(draft || managerCallStatus !== 'idle') ? 'text-4xl' : 'text-6xl'}`}>
                 {isConnected ? '🎙' : '📞'}
               </span>
               {isConnected && <div className="absolute inset-0 bg-gold-500/5 animate-pulse"></div>}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-6">
             {!isConnected && (
               <div className="text-center space-y-2 mb-8">
                 <h3 className="font-serif text-2xl font-bold text-navy-900 tracking-tight">Voice Reception</h3>
                 <p className="text-stone-500 text-sm">Speak naturally to request bookings or guest services.</p>
               </div>
             )}

             <div className={`w-full h-24 rounded-3xl overflow-hidden transition-all duration-700 relative border border-stone-100 shadow-inner bg-[#FDFCF9]
                ${isConnected ? 'opacity-100 translate-y-0' : 'opacity-30 grayscale translate-y-4'}`}>
                <Visualizer analyser={analyserRef.current} isActive={micActive} color="#bfa026" />
             </div>

             {!isConnected ? (
              <button
                onClick={startSession}
                className="w-full group bg-navy-950 text-white font-black py-5 px-10 rounded-2xl overflow-hidden shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
              >
                <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-[0.3em]">
                   <span>Connect Live Agent</span>
                   <span className="text-gold-500">→</span>
                </div>
              </button>
            ) : (
              <button
                onClick={stopAudio}
                className="w-full bg-red-50 text-red-600 font-black py-5 rounded-2xl transition-all shadow-md hover:bg-red-100 text-xs uppercase tracking-[0.3em]"
              >
                Disconnect
              </button>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-red-100 animate-fade-in-up">
              {error}
            </div>
          )}
        </div>

        {/* Dynamic Display Panel */}
        {(draft || managerCallStatus !== 'idle') && (
           <div className="w-1/2 h-full flex items-center justify-start py-8 pr-8 animate-slide-in relative">
              {managerCallStatus !== 'idle' ? (
                <div className="w-full max-w-sm mx-auto">
                   <ManagerCallInterface status={managerCallStatus} />
                </div>
              ) : (
                <div className="w-full h-full max-w-sm mx-auto">
                   <LiveBookingPanel draft={draft!} />
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
};

export default VoiceMode;