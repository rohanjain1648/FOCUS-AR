
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Thought, AppState, UserStats, StressIndicator, PresenceExercise } from './types';
import CameraHUD from './components/CameraHUD';
import MemoryVault from './components/MemoryVault';
import PresenceGuide from './components/PresenceGuide';
import { analyzeThought, detectStressFromFrames } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [lastStressResult, setLastStressResult] = useState<{score: number, indicators: StressIndicator[], exercise: PresenceExercise} | null>(null);
  const [stats, setStats] = useState<UserStats>({
    thoughtsOffloaded: 0,
    presenceTime: 0,
    anxietyEvents: 0,
    averageStressScore: 0
  });
  const [currentTranscription, setCurrentTranscription] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const lastGuideTimeRef = useRef<number>(0);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
          .toLowerCase();

        if (transcript.includes('remember this thought') && appState !== AppState.LISTENING) {
          triggerCapture();
        } else if (appState === AppState.LISTENING) {
          setCurrentTranscription(transcript);
        }
      };

      recognitionRef.current.start();
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [appState]);

  const triggerCapture = () => {
    setAppState(AppState.LISTENING);
    setCurrentTranscription('Listening...');
    setTimeout(() => finalizeCapture(), 6000); 
  };

  const finalizeCapture = async () => {
    if (currentTranscription === '' || currentTranscription === 'Listening...') {
      setAppState(AppState.IDLE);
      return;
    }

    setAppState(AppState.SAVING);
    try {
      const analysis = await analyzeThought(currentTranscription);
      const newThought: Thought = {
        id: Date.now().toString(),
        content: currentTranscription,
        timestamp: Date.now(),
        tags: [analysis.category],
        priority: analysis.priority
      };

      setThoughts(prev => [newThought, ...prev]);
      setStats(prev => ({ ...prev, thoughtsOffloaded: prev.thoughtsOffloaded + 1 }));
      setAppState(AppState.CONFIRMED);
      
      playVoiceConfirmation("Got it. You can stay present now.");
      setTimeout(() => setAppState(AppState.IDLE), 3000);
    } catch (err) {
      console.error(err);
      setAppState(AppState.IDLE);
    }
  };

  const playVoiceConfirmation = (text: string) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 1.0;
    msg.pitch = 1.0;
    window.speechSynthesis.speak(msg);
  };

  const handleFrames = useCallback(async (base64Array: string[]) => {
    const result = await detectStressFromFrames(base64Array);
    if (!result) return;
    
    setLastStressResult({
      score: result.stressScore,
      indicators: result.indicators,
      exercise: result.presenceExercise
    });

    const now = Date.now();
    const cooldown = 60000;

    if ((result.isHighStress || result.stressScore > 75) && (now - lastGuideTimeRef.current > cooldown)) {
      setAppState(AppState.GUIDING);
      lastGuideTimeRef.current = now;
      setStats(prev => ({ 
        ...prev, 
        anxietyEvents: prev.anxietyEvents + 1,
        averageStressScore: Math.round((prev.averageStressScore + result.stressScore) / 2)
      }));
      playVoiceConfirmation("Breath with me for a moment.");
    } else if (result.isHighStress || result.stressScore > 60) {
      setAppState(AppState.STRESSED);
      setStats(prev => ({ 
        ...prev, 
        averageStressScore: Math.round((prev.averageStressScore + result.stressScore) / 2)
      }));
      setTimeout(() => setAppState(prev => prev === AppState.STRESSED ? AppState.IDLE : prev), 8000);
    } else {
      setStats(prev => ({ 
        ...prev, 
        averageStressScore: Math.round((prev.averageStressScore + result.stressScore) / 2)
      }));
    }
  }, []);

  const isCapturing = appState === AppState.LISTENING || appState === AppState.SAVING;
  const isHighStress = appState === AppState.STRESSED || (lastStressResult?.score || 0) > 70;
  const isConfirmed = appState === AppState.CONFIRMED;

  return (
    <div className="relative h-screen w-screen overflow-hidden flex text-white select-none">
      <CameraHUD 
        onFrames={handleFrames} 
        isActive={appState === AppState.IDLE || appState === AppState.STRESSED} 
        isHighStress={isHighStress}
        isCapturing={isCapturing}
        isConfirmed={isConfirmed}
      />

      {/* Main HUD Overlays */}
      <div className="relative z-10 w-full h-full flex p-8 gap-8 pointer-events-none">
        
        {/* Left Side: Biometric & Core Data */}
        <div className="flex flex-col gap-6 w-72">
          <div className="ar-glass p-5 rounded-2xl border-l-4 border-l-sky-500 shadow-2xl transition-colors duration-500" style={{ borderLeftColor: isHighStress ? '#ef4444' : '#38bdf8' }}>
            <h1 className="font-orbitron text-xl font-bold tracking-widest text-sky-400">FOCUS AR</h1>
            <p className="text-[10px] text-sky-300/40 uppercase tracking-[0.3em] mt-1 font-semibold italic">Neuro-Sync HUD v2.5</p>
          </div>

          {/* Biometric Stress Meter */}
          <div className="ar-glass p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-orbitron">COGNITIVE LOAD</span>
              <span className={`text-[11px] font-bold ${
                (lastStressResult?.score || 0) > 60 ? 'text-red-400' : 'text-sky-400'
              }`}>{lastStressResult?.score || 0}%</span>
            </div>
            
            <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-1000 ${
                  (lastStressResult?.score || 0) > 60 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-sky-500 shadow-[0_0_10px_#0ea5e9]'
                }`}
                style={{ width: `${lastStressResult?.score || 0}%` }}
              />
            </div>

            {/* Granular Indicators */}
            <div className="space-y-2 max-h-40 overflow-hidden">
              {lastStressResult?.indicators.map((ind, i) => (
                <div key={i} className="flex items-start gap-2 text-[9px] animate-in fade-in slide-in-from-left duration-500">
                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${ind.severity > 50 ? 'bg-red-400' : 'bg-sky-400'}`} />
                  <div className="flex-1">
                    <span className="text-slate-200 block font-semibold">{ind.type.toUpperCase()}</span>
                    <span className="text-slate-400/80 leading-tight">{ind.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Stats Card */}
          <div className="ar-glass p-5 rounded-2xl">
            <h3 className="text-[10px] text-slate-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Presence Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-orbitron text-sky-400 leading-none">{stats.thoughtsOffloaded}</p>
                <p className="text-[8px] text-slate-500 uppercase mt-1">Total Offloads</p>
              </div>
              <div>
                <p className="text-2xl font-orbitron text-sky-400 leading-none">{stats.averageStressScore}%</p>
                <p className="text-[8px] text-slate-500 uppercase mt-1">Session Avg</p>
              </div>
            </div>
          </div>

          <div className="mt-auto ar-glass p-4 rounded-xl text-[10px] text-sky-400/40 border border-sky-500/10 italic">
            Presence Guide initialized. AI monitoring for interruption behaviors...
          </div>
        </div>

        {/* Center Area: AR Focal Point */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {appState === AppState.LISTENING && (
            <div className="ar-glass p-10 rounded-full border-2 border-green-500/40 flex flex-col items-center gap-6 animate-in zoom-in duration-500 backdrop-blur-xl">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center">
                  <i className="fa-solid fa-microphone-lines text-green-400 text-3xl"></i>
                </div>
              </div>
              <div className="text-center">
                <p className="font-orbitron text-green-400 tracking-[0.3em] text-sm font-bold">UPLINK ACTIVE</p>
                <p className="text-slate-300 mt-4 max-w-sm italic font-light">"{currentTranscription}"</p>
              </div>
            </div>
          )}

          {appState === AppState.GUIDING && lastStressResult?.exercise && (
            <PresenceGuide 
              exercise={lastStressResult.exercise} 
              onComplete={() => setAppState(AppState.IDLE)} 
            />
          )}

          {appState === AppState.STRESSED && (
            <div className="ar-glass p-10 rounded-3xl border-2 border-red-500/30 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500 backdrop-blur-xl max-w-lg text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                <i className="fa-solid fa-brain-circuit text-red-400 text-2xl animate-pulse"></i>
              </div>
              <div>
                <p className="font-orbitron text-red-400 tracking-[0.4em] text-lg font-bold">SYNC WARNING</p>
                <p className="text-slate-300 mt-3 text-sm font-light leading-relaxed">
                  High load detected. <br/>
                  <span className="text-red-300/80 font-bold uppercase text-xs">Behavioral Drift:</span> Offload now to reset.
                </p>
              </div>
            </div>
          )}

          {appState === AppState.CONFIRMED && (
            <div className="ar-glass p-10 rounded-full border-2 border-sky-400/30 flex flex-col items-center gap-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-sky-500/20 flex items-center justify-center">
                <i className="fa-solid fa-shield-check text-sky-400 text-3xl"></i>
              </div>
              <div className="text-center">
                <p className="font-orbitron text-sky-400 tracking-[0.3em] text-sm font-bold">BUFFER CLEARED</p>
                <p className="text-sky-300/60 text-[11px] mt-2 uppercase">Return to Center</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Data Vault */}
        <MemoryVault thoughts={thoughts} onClear={() => setThoughts([])} />
      </div>

      {/* Controller Bar */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 z-20 pointer-events-auto">
        <button 
          onClick={triggerCapture}
          className={`group relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-700 ${
            appState === AppState.LISTENING 
            ? 'bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.6)]' 
            : 'bg-sky-600 hover:bg-sky-500 shadow-[0_0_30px_rgba(14,165,233,0.4)]'
          }`}
        >
          <div className={`absolute inset-0 rounded-full border-2 border-white/20 transition-transform duration-1000 ${appState === AppState.LISTENING ? 'scale-125 opacity-0' : 'animate-pulse opacity-20'}`} />
          <i className={`fa-solid ${appState === AppState.LISTENING ? 'fa-circle-stop' : 'fa-brain-arrow-curved-right'} text-3xl text-white`}></i>
          
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-sky-500/30 px-4 py-2 rounded-lg text-[10px] font-orbitron tracking-widest text-sky-400 opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-2xl">
            {appState === AppState.LISTENING ? 'STOP UPLINK' : 'INSTANT OFFLOAD'}
          </div>
        </button>
      </div>

      {/* Ambient HUD Noise Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </div>
  );
};

export default App;
