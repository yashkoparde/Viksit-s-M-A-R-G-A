import React, { useEffect, useState, useRef } from 'react';

interface MargaCinematicIntroProps {
  onComplete: () => void;
}

export const MargaCinematicIntro: React.FC<MargaCinematicIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'black' | 'letters' | 'tagline' | 'flash' | 'dissolve'>('black');
  const [activeLetter, setActiveLetter] = useState<number>(-1);
  const audioPlayed = useRef(false);

  // Play cinematic sub-bass chord using Web Audio API
  const playCinematicSound = () => {
    if (audioPlayed.current) return;
    audioPlayed.current = true;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;

      // Deep Sub Bass "Ta-Dum" 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, now); // A1 note
      osc1.frequency.exponentialRampToValueAtTime(32, now + 1.2);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.4, now + 0.1);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 2.0);

      // Higher Ambient Chime & Harmonic Swell
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(220, now + 0.2); // A3
      osc2.frequency.exponentialRampToValueAtTime(440, now + 1.8);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.15, now + 0.5);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 2.5);

      // High Shimmer Chime
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(880, now + 0.4);
      gain3.gain.setValueAtTime(0, now);
      gain3.gain.linearRampToValueAtTime(0.08, now + 0.6);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.4);
      osc3.stop(now + 2.8);
    } catch {
      // Browser autoplay restriction fallback - silent mode continues gracefully
    }
  };

  useEffect(() => {
    // Phase 1: Start letter sequence
    const t0 = setTimeout(() => {
      playCinematicSound();
      setPhase('letters');
    }, 300);

    // Sequential letter illumination (M -> A -> R -> G -> A)
    const letterTimers: NodeJS.Timeout[] = [];
    for (let i = 0; i < 5; i++) {
      letterTimers.push(
        setTimeout(() => {
          setActiveLetter(i);
        }, 400 + i * 220)
      );
    }

    // Phase 2: Tagline Reveal
    const t1 = setTimeout(() => {
      setPhase('tagline');
    }, 1700);

    // Phase 3: High impact cinematic light flash & zoom
    const t2 = setTimeout(() => {
      setPhase('flash');
    }, 2800);

    // Phase 4: Smooth dissolve out
    const t3 = setTimeout(() => {
      setPhase('dissolve');
    }, 3300);

    // Phase 5: Complete unmount
    const t4 = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      letterTimers.forEach(clearTimeout);
    };
  }, [onComplete]);

  const letters = ['M', 'A', 'R', 'G', 'A'];

  return (
    <div 
      onClick={() => {
        playCinematicSound();
        onComplete();
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 select-none overflow-hidden transition-all duration-700 cursor-pointer ${
        phase === 'dissolve' ? 'opacity-0 pointer-events-none scale-110 blur-md' : 'opacity-100'
      }`}
    >
      {/* Volumetric Radial Light Glow */}
      <div 
        className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18)_0%,rgba(15,23,42,0.6)_50%,rgba(2,6,23,0.98)_100%)] transition-opacity duration-1000 ${
          phase !== 'black' ? 'opacity-100' : 'opacity-0'
        }`} 
      />

      {/* Anamorphic Horizontal Lens Flare Streak */}
      <div 
        className={`absolute w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-all duration-1000 blur-[1px] ${
          phase === 'flash' 
            ? 'opacity-100 scale-x-125 scale-y-[400%] shadow-[0_0_80px_#10b981]' 
            : phase === 'tagline' || phase === 'letters'
            ? 'opacity-30 scale-x-100'
            : 'opacity-0 scale-x-0'
        }`} 
      />

      {/* Film Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

      {/* Center Cinematic Ident */}
      <div className="relative z-10 flex flex-col items-center text-center">
        
        {/* Letters Container */}
        <div className="flex items-center gap-3 sm:gap-6 md:gap-8 tracking-widest">
          {letters.map((char, index) => {
            const isLit = index <= activeLetter;
            return (
              <span
                key={index}
                className={`font-black font-mono transition-all duration-500 transform text-5xl sm:text-7xl md:text-8xl lg:text-9xl ${
                  isLit
                    ? 'opacity-100 scale-100 text-white drop-shadow-[0_0_35px_rgba(16,185,129,0.85)]'
                    : 'opacity-0 scale-125 text-slate-800'
                } ${
                  phase === 'flash' ? 'text-emerald-300 drop-shadow-[0_0_60px_rgba(52,211,153,1)] scale-105' : ''
                }`}
                style={{
                  textShadow: isLit 
                    ? '0 0 20px rgba(16, 185, 129, 0.9), 0 0 40px rgba(16, 185, 129, 0.4), 0 0 80px rgba(16, 185, 129, 0.2)' 
                    : 'none'
                }}
              >
                {char}
                {index < letters.length - 1 && (
                  <span className={`inline-block mx-1 sm:mx-2 md:mx-3 text-emerald-500/60 text-3xl sm:text-5xl font-light transition-opacity duration-300 ${isLit ? 'opacity-80' : 'opacity-0'}`}>
                    ·
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Cinematic Subtitle Reveal */}
        <div 
          className={`mt-8 sm:mt-12 transition-all duration-1000 transform ${
            phase === 'tagline' || phase === 'flash' || phase === 'dissolve'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="text-[11px] sm:text-xs md:text-sm font-mono tracking-[0.3em] sm:tracking-[0.45em] text-emerald-400 font-bold uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            Monitoring · Analytics · Geotagging · Audit
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono tracking-widest mt-2 uppercase">
            Government of India · Civic Infrastructure OS
          </p>
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className="absolute bottom-8 right-8 text-xs font-mono text-slate-400 hover:text-white px-3.5 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 backdrop-blur-md transition-all hover:border-slate-700 cursor-pointer z-20"
      >
        Skip Intro ➔
      </button>
    </div>
  );
};
