import React from 'react';
import { ManagerCallStatus } from '../types';

interface ManagerCallInterfaceProps {
  status: ManagerCallStatus;
}

const ManagerCallInterface: React.FC<ManagerCallInterfaceProps> = ({ status }) => {
  if (status === 'idle') return null;

  return (
    <div className="w-full max-w-sm bg-navy-900 rounded-2xl shadow-2xl border border-navy-800 overflow-hidden flex flex-col items-center justify-center p-8 animate-fade-in-up relative text-white">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-800 to-navy-950 opacity-90"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        
        {/* Avatar / Icon */}
        <div className="relative">
          {status === 'calling' && (
            <div className="absolute inset-0 bg-gold-500 rounded-full animate-ping opacity-20"></div>
          )}
          <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center shadow-lg transition-all duration-500
            ${status === 'calling' ? 'border-gold-400 bg-navy-800' : 
              status === 'busy' ? 'border-red-500 bg-red-900/20' : 
              status === 'completed' ? 'border-green-500 bg-green-900/20' : 'border-blue-500 bg-navy-800'}`}>
             
             <span className="text-4xl">
               {status === 'calling' ? '👤' : 
                status === 'busy' ? '🚫' : 
                status === 'sending_msg' ? '📨' : '✅'}
             </span>
          </div>
          {status === 'calling' && (
             <div className="absolute -bottom-2 -right-2 bg-gold-500 text-navy-900 text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
               DIALING
             </div>
          )}
        </div>

        {/* Text Status */}
        <div className="space-y-2">
          <h3 className="text-xl font-serif font-bold tracking-wide">
            {status === 'calling' ? 'Connecting to Manager...' :
             status === 'busy' ? 'Manager Unavailable' :
             status === 'sending_msg' ? 'Auto-Forwarding Message' :
             'Message Delivered'}
          </h3>
          <p className="text-stone-400 text-sm">
            {status === 'calling' ? 'Priority Line • Wait time < 1m' :
             status === 'busy' ? 'All lines are currently busy.' :
             status === 'sending_msg' ? 'Generating urgent transcript...' :
             'Priority Inbox #9281'}
          </p>
        </div>

        {/* Progress Bar for Sending */}
        {status === 'sending_msg' && (
          <div className="w-full bg-navy-800 rounded-full h-1.5 mt-4 overflow-hidden">
            <div className="h-full bg-blue-500 w-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerCallInterface;