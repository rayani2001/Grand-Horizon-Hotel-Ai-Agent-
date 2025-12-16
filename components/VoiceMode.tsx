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

  // Audio Context Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Session Refs
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
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
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
            console.log('Session Opened');
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
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
             }
             if (msg.toolCall) {
                sessionPromiseRef.current?.then(session => handleToolCall(msg.toolCall, session));
             }
          },
          onclose: () => {
            console.log('Session Closed');
            stopAudio();
          },
          onerror: (err) => {
            console.error(err);
            setError("Connection error. Please try again.");
            stopAudio();
          }
        }
      });

    } catch (e) {
      console.error(e);
      setError("Failed to access microphone or connect.");
      stopAudio();
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gold-100 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-navy-100 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10 flex h-full p-6 animate-fade-in-up gap-8 items-center justify-center">
        
        {/* Left Side: Voice Controls */}
        <div className={`flex flex-col items-center justify-center space-y-8 transition-all duration-700 
          ${(draft || managerCallStatus !== 'idle') ? 'w-1/2 items-end pr-8 border-r border-stone-100' : 'w-full max-w-sm'}`}>
          
          {/* Header Section */}
          {!draft && managerCallStatus === 'idle' && (
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif font-bold text-navy-900 tracking-tight">Voice Reception</h2>
              <p className="text-stone-500 max-w-xs mx-auto text-sm">Tap the microphone to speak directly with our AI Concierge.</p>
            </div>
          )}

          {/* Status Indicator / Main Button Wrapper */}
          <div className="relative mb-4">
            {isConnected && (
              <>
                <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gold-400 opacity-20 animate-ping"></div>
                <div className="absolute -inset-4 rounded-full border border-gold-200 opacity-40 animate-pulse"></div>
              </>
            )}

            <div 
              className={`rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 relative overflow-hidden group
                ${isConnected ? 'bg-gradient-to-br from-navy-900 to-navy-800 scale-105' : 'bg-white border-4 border-stone-50'}
                ${(draft || managerCallStatus !== 'idle') ? 'w-32 h-32' : 'w-40 h-40'}`} 
            >
               <span className={`transition-all duration-500 z-10 ${isConnected ? 'text-white' : 'text-stone-300 group-hover:text-gold-500'} ${(draft || managerCallStatus !== 'idle') ? 'text-4xl' : 'text-5xl'}`}>
                 {isConnected ? '🎙️' : '📞'}
               </span>
               {isConnected && <div className="absolute inset-0 bg-gold-500 opacity-10 blur-xl"></div>}
            </div>

            <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg transition-all duration-300
              ${isConnected ? 'bg-gold-500 text-white translate-y-0' : 'bg-stone-200 text-stone-500 translate-y-2 opacity-0'}`}>
              On Air
            </div>
          </div>

          {/* Controls */}
          <div className="w-full max-w-xs space-y-4">
             <div className={`w-full h-24 rounded-2xl overflow-hidden transition-all duration-700 relative border border-stone-100 shadow-inner bg-stone-50
                ${isConnected ? 'opacity-100 translate-y-0' : 'opacity-50 grayscale translate-y-4'}`}>
                <Visualizer analyser={analyserRef.current} isActive={micActive} color="#bfa026" />
             </div>

             {!isConnected ? (
              <button
                onClick={startSession}
                className="w-full group relative bg-navy-900 text-white font-bold py-4 px-8 rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                <div className="flex items-center justify-center gap-3">
                   <span>Start Conversation</span>
                   <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ) : (
              <button
                onClick={stopAudio}
                className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-4 px-8 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                End Call
              </button>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs border border-red-100 shadow-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        {/* Right Side: Panels (Draft or Manager Call) */}
        {(draft || managerCallStatus !== 'idle') && (
           <div className="w-1/2 h-full flex items-center justify-start pl-8 animate-slide-in relative">
              {managerCallStatus !== 'idle' ? (
                <ManagerCallInterface status={managerCallStatus} />
              ) : (
                <LiveBookingPanel draft={draft!} />
              )}
           </div>
        )}
      </div>
    </div>
  );
};

export default VoiceMode;