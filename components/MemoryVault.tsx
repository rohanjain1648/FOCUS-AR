
import React from 'react';
import { Thought } from '../types';

interface MemoryVaultProps {
  thoughts: Thought[];
  onClear: () => void;
}

const MemoryVault: React.FC<MemoryVaultProps> = ({ thoughts, onClear }) => {
  return (
    <div className="w-80 h-full ar-glass p-4 flex flex-col pointer-events-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-orbitron text-sky-400 text-sm tracking-widest uppercase">Memory Vault</h2>
        <button onClick={onClear} className="text-xs text-sky-500/50 hover:text-sky-300 transition-colors">
          CLEAR ALL
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {thoughts.length === 0 ? (
          <div className="text-center text-slate-500 italic text-sm py-10">
            No thoughts offloaded yet.<br/>Presence is high.
          </div>
        ) : (
          thoughts.map(t => (
            <div key={t.id} className="p-3 bg-white/5 border border-white/10 rounded-lg group hover:border-sky-500/50 transition-all">
              <div className="flex justify-between text-[10px] text-sky-300/60 mb-1">
                <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                <span className={`px-1 rounded ${
                  t.priority === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-sky-500/20 text-sky-300'
                }`}>
                  {t.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{t.content}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.tags.map(tag => (
                  <span key={tag} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">#{tag}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemoryVault;
