
import React, { useEffect, useState } from 'react';
import { PresenceExercise } from '../types';

interface PresenceGuideProps {
  exercise: PresenceExercise;
  onComplete: () => void;
}

const PresenceGuide: React.FC<PresenceGuideProps> = ({ exercise, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(exercise.duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
      <div className="relative flex items-center justify-center">
        {/* Visual Focus Element */}
        {exercise.visualType === 'breathing' && (
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-sky-400/30 rounded-full animate-[ping_4s_ease-in-out_infinite]" />
            <div className="w-32 h-32 bg-sky-500/10 border-2 border-sky-400/50 rounded-full flex items-center justify-center transition-all duration-[4000ms] animate-[pulse_4s_ease-in-out_infinite]">
              <div className="text-sky-300 font-orbitron text-xs font-bold">BREATHE</div>
            </div>
          </div>
        )}

        {exercise.visualType === 'focus' && (
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div className="w-4 h-4 bg-sky-400 rounded-full shadow-[0_0_20px_#38bdf8] animate-pulse" />
            <div className="absolute w-24 h-24 border border-sky-400/20 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
          </div>
        )}

        {exercise.visualType === 'grounding' && (
          <div className="relative w-48 h-48 grid grid-cols-2 gap-2 opacity-60">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border border-sky-400/40 rounded bg-sky-400/5 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
        )}
      </div>

      <div className="ar-glass p-8 rounded-3xl max-w-md text-center border-t-4 border-t-sky-400">
        <h2 className="font-orbitron text-sky-400 tracking-[0.3em] text-lg mb-2">{exercise.title.toUpperCase()}</h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">{exercise.instructions}</p>
        <div className="flex items-center justify-center gap-4">
          <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-sky-400 transition-all duration-1000" 
              style={{ width: `${(timeLeft / exercise.duration) * 100}%` }} 
            />
          </div>
          <span className="font-orbitron text-[10px] text-sky-400 w-8">{timeLeft}s</span>
        </div>
      </div>
    </div>
  );
};

export default PresenceGuide;
