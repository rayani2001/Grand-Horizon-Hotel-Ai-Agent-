import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MODEL_VOICE, SYSTEM_INSTRUCTION, TOOLS } from '../constants';
import { TicketType, DraftBooking, ManagerCallStatus, EmailTicket } from '../types';
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
    sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
    sourcesRef.current.clear();
    if (inputContextRef.current) { inputContextRef.current.close().catch(() => {}); inputContextRef.current = null; }
    if (outputContextRef.current) { outputContextRef.current.close().catch(() => {}); outputContextRef.current = null; }
    setIsConnected(false);
    setMicActive(false);
    analyserRef.current = null;
  }, []);

  const handleToolCall = useCallback(async (toolCall: any, session: any) => {
    const functionResponses = [];
    for (const fc of toolCall.functionCalls) {
      const args = fc.args;
      let result: any = { status: 'success' };
      
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
      } else if (fc.name === 'sendEmailConfirmation') {
        setDraft(prev => prev ? { ...prev, emailStatus: 'sending' } : null);
        
        await new Promise(r => setTimeout(r, 2000));
        
        const emailBody = `Dear Mr/Ms. ${args.guestName || 'Guest'},\n\nIt is our distinct pleasure to confirm your upcoming residence at the Grand Horizon Hotel.\n\nYour reservation summary:\n${args.bookingDetails || 'Standard Summer Package'}\n\nPlease find your official digital key and arrival instructions attached to this record.\n\nWarm Regards,\nThe Grand Horizon Concierge Team`;

        const newEmail: EmailTicket = {
          id: Date.now().toString(),
          email: args.email,
          guestName: args.guestName || 'Valued Guest',
          subject: `Reservation Confirmation: ${draft?.bookingId || 'Horizon Palace'}`,
          body: emailBody,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false
        };

        onTicketCreated({
          type: 'EMAIL_DISPATCH',
          data: newEmail
        });
        
        setDraft(prev => prev ? { ...prev, emailStatus: 'sent' } : null);
        result = { status: 'sent', confirmation: 'Email successfully dispatched through Horizon Mail Server.' };
        
      } else if (fc.name === 'saveReservation') {
        const confCode = Math.random().toString(36).substring(7).toUpperCase();
        onTicketCreated({
          type: 'RESERVATION',
          data: { ...args, confirmationCode: confCode }
        });
        setDraft(prev => prev ? { ...prev, status: 'confirmed' } : null);
      } else if (fc.name === 'attemptManagerCall') {
        setManagerCallStatus('calling');
        await new Promise(r => setTimeout(r, 2000));
        setManagerCallStatus('busy');
        result = { status: 'busy' };
      } else if (fc.name === 'createManagerMessage') {
        onTicketCreated({
          type: 'MANAGER',
          data: { ...args, timestamp: new Date().toLocaleTimeString() }
        });
        setManagerCallStatus('completed');
        setTimeout(() => setManagerCallStatus('idle'), 3000);
      }
      functionResponses.push({ id: fc.id, name: fc.name, response: { result } });
    }
    session.sendToolResponse({ functionResponses });
  }, [onTicketCreated, draft]);

  const startSession = async () => {
    setError(null);
    setDraft({ status: 'active', bookingId: `BK-${Math.floor(10000 + Math.random() * 90000)}` });
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = outputContextRef.current.createGain();
      outputNode.connect(outputContextRef.current.destination);
      const analyser = inputContextRef.current.createAnalyser();
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
            setIsConnected(true); setMicActive(true);
            const source = inputContextRef.current!.createMediaStreamSource(streamRef.current!);
            source.connect(analyser); 
            const processor = inputContextRef.current!.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const pcmBlob = createPcmBlob(e.inputBuffer.getChannelData(0));
              sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(processor);
            processor.connect(inputContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && outputContextRef.current) {
                const buffer = await decodeAudioData(base64ToUint8Array(audioData), outputContextRef.current);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current.currentTime);
                const source = outputContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(outputNode);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
             }
             if (msg.toolCall) {
                sessionPromiseRef.current?.then(session => handleToolCall(msg.toolCall, session));
             }
          },
          onclose: () => stopAudio(),
          onerror: () => stopAudio()
        }
      });
    } catch (e) { setError("Mic access required."); stopAudio(); setDraft(null); }
  };

  useEffect(() => { return () => stopAudio(); }, [stopAudio]);

  return (
    <div className="flex h-full bg-white relative">
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between z-20">
         <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-stone-200'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">{isConnected ? 'Concierge Connected' : 'Waiting for Guest'}</span>
         </div>
      </div>

      <div className="flex w-full h-full items-center p-8 gap-10">
        <div className={`flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${draft ? 'w-5/12' : 'w-full'}`}>
          <div className="relative mb-12">
            <div className={`w-44 h-44 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 relative overflow-hidden
                ${isConnected ? 'bg-navy-950 ring-[12px] ring-gold-500/10 scale-105' : 'bg-white border border-stone-100'}
              `}>
               <span className={`transition-all duration-500 z-10 ${isConnected ? 'text-white' : 'text-stone-300'} ${draft ? 'text-4xl' : 'text-6xl'}`}>
                 {isConnected ? '🎙' : '📞'}
               </span>
            </div>
          </div>
          <div className="w-full max-w-xs space-y-8 text-center">
             <div className={`h-28 rounded-[2rem] overflow-hidden border bg-[#FDFCF9] transition-all duration-700 ${isConnected ? 'opacity-100 border-gold-200' : 'opacity-30 border-stone-200'}`}>
               <Visualizer analyser={analyserRef.current} isActive={micActive} color="#bfa026" />
             </div>
             {!isConnected ? (
              <button onClick={startSession} className="w-full bg-navy-950 text-white font-black py-6 rounded-2xl text-[11px] uppercase tracking-[0.4em] shadow-xl hover:scale-[1.02] transition-all">Initialize Voice Link</button>
            ) : (
              <button onClick={stopAudio} className="w-full bg-red-50 text-red-600 font-black py-6 rounded-2xl text-[11px] uppercase tracking-[0.4em] transition-all">Terminate Call</button>
            )}
          </div>
        </div>

        {draft && (
           <div className="w-7/12 h-[650px] animate-fade-in-up">
              <LiveBookingPanel draft={draft} />
           </div>
        )}

        {managerCallStatus !== 'idle' && !draft && (
           <div className="w-7/12 h-[650px] animate-fade-in-up">
              <ManagerCallInterface status={managerCallStatus} />
           </div>
        )}
      </div>
    </div>
  );
};

export default VoiceMode;
