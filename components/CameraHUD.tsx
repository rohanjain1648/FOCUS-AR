
import React, { useEffect, useRef } from 'react';

interface CameraHUDProps {
  onFrames: (base64Array: string[]) => void;
  isActive: boolean;
  isHighStress?: boolean;
  isCapturing?: boolean;
  isConfirmed?: boolean;
}

const CameraHUD: React.FC<CameraHUDProps> = ({ onFrames, isActive, isHighStress, isCapturing, isConfirmed }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }

    startCamera();

    const captureBurst = async () => {
      if (!isActive || !videoRef.current || !canvasRef.current) return;
      
      const frames: string[] = [];
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      for (let i = 0; i < 3; i++) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
        frames.push(base64);
        if (i < 2) await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      onFrames(frames);
    };

    const interval = setInterval(() => {
      captureBurst();
    }, 15000);

    return () => {
      clearInterval(interval);
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [isActive, onFrames]);

  const primaryColor = isHighStress ? 'border-red-500' : isCapturing ? 'border-green-500' : 'border-sky-400';
  const textColor = isHighStress ? 'text-red-500' : isCapturing ? 'text-green-500' : 'text-sky-400';
  const ringColor = isHighStress ? 'rgba(239, 68, 68, 0.3)' : isCapturing ? 'rgba(34, 197, 94, 0.3)' : 'rgba(56, 189, 248, 0.3)';

  return (
    <div className={`fixed inset-0 z-0 bg-black transition-colors duration-1000 ${isHighStress ? 'bg-red-950/20' : ''}`}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className={`w-full h-full object-cover opacity-50 transition-all duration-1000 ${isHighStress ? 'grayscale-0 contrast-150 brightness-75' : 'grayscale-[0.6]'}`}
      />
      <canvas ref={canvasRef} width="320" height="240" className="hidden" />
      
      {/* Noise Overlay for Critical Stress */}
      {isHighStress && (
        <div className="absolute inset-0 z-10 opacity-[0.15] pointer-events-none overflow-hidden">
          <div className="absolute inset-[-100%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-noise" />
        </div>
      )}

      {/* HUD Elements Container */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${isHighStress ? 'animate-glitch' : ''}`}>
        {/* Scanning motion overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${isHighStress ? 'via-red-500/40' : isCapturing ? 'via-green-500/20' : 'via-sky-500/10'} to-transparent h-1/2 w-full animate-scan`} />
        
        {/* AR Grid Overlay */}
        <div className={`absolute inset-0 opacity-10 transition-colors duration-1000`} style={{ backgroundImage: `radial-gradient(${isHighStress ? '#ef4444' : isCapturing ? '#22c55e' : '#38bdf8'} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

        {/* Corner Brackets */}
        <div className={`absolute top-12 left-12 w-20 h-20 border-t-2 border-l-2 ${primaryColor} transition-colors duration-500 ${isHighStress ? 'animate-alert' : ''}`} />
        <div className={`absolute top-12 right-12 w-20 h-20 border-t-2 border-r-2 ${primaryColor} transition-colors duration-500 ${isHighStress ? 'animate-alert' : ''}`} />
        <div className={`absolute bottom-12 left-12 w-20 h-20 border-b-2 border-l-2 ${primaryColor} transition-colors duration-500 ${isHighStress ? 'animate-alert' : ''}`} />
        <div className={`absolute bottom-12 right-12 w-20 h-20 border-b-2 border-r-2 ${primaryColor} transition-colors duration-500 ${isHighStress ? 'animate-alert' : ''}`} />
        
        {/* Center Targeting Ring */}
        <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 hud-ring transition-colors duration-500" 
            style={{ borderColor: ringColor }}
        />

        {/* Success Ripple Effect */}
        {isConfirmed && (
          <div className="absolute top-1/2 left-1/2 w-96 h-96 border-4 border-sky-400 rounded-full animate-ripple" />
        )}

        {/* Status Indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            {isHighStress && (
                <div className="font-orbitron text-red-500 text-xs tracking-widest animate-pulse flex items-center gap-2 bg-red-950/40 px-3 py-1 rounded border border-red-500/30">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    NEURAL INTERFERENCE: CRITICAL
                </div>
            )}
            {isCapturing && (
                <div className="font-orbitron text-green-500 text-xs tracking-widest animate-pulse flex items-center gap-2">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                    DATA UPLINK ACTIVE
                </div>
            )}
            <div className={`font-orbitron ${textColor} text-[10px] tracking-[0.3em] opacity-40 uppercase transition-colors duration-500`}>
                Neural Feed: {isHighStress ? 'Unstable' : 'Synchronized'}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CameraHUD;
