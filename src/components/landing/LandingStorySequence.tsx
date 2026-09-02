import React, { useEffect, useRef, useState } from 'react';
import { Role, AuthUser } from '../../types';
import { 
  ShieldCheck, 
  Landmark, 
  Building2, 
  Compass, 
  Scale, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  LogOut, 
  Play, 
  Eye, 
  TrendingUp,
  Cpu
} from 'lucide-react';

interface LandingStorySequenceProps {
  onSelectRoleForAuth: (role: Role) => void;
  currentUser: AuthUser | null;
  onProceedToDashboard: () => void;
  onLogout: () => void;
}

export const LandingStorySequence: React.FC<LandingStorySequenceProps> = ({
  onSelectRoleForAuth,
  currentUser,
  onProceedToDashboard,
  onLogout,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [manifest, setManifest] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());

  // Fetch sequence manifest
  useEffect(() => {
    let active = true;
    const fetchManifest = async () => {
      try {
        const res = await fetch('/api/sequence-manifest');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            setManifest(data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch manifest, using fallback generation', err);
        // Fallback: 480 frames
        const fallback = Array.from({ length: 480 }, (_, i) => 
          `frame_${String(i).padStart(3, '0')}_delay-0.04s.gif`
        );
        if (active) setManifest(fallback);
      }
    };
    fetchManifest();
    return () => { active = false; };
  }, []);

  // Preload and render frames
  useEffect(() => {
    if (!manifest.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      drawFrame(currentFrame);
    };

    window.addEventListener('resize', resize);
    resize();

    const preloadImage = (index: number): Promise<HTMLImageElement | null> => {
      if (imageCache.current.has(index)) {
        return Promise.resolve(imageCache.current.get(index)!);
      }
      return new Promise((resolve) => {
        const img = new Image();
        img.src = `/sequence/${manifest[index]}`;
        img.onload = () => {
          imageCache.current.set(index, img);
          resolve(img);
        };
        img.onerror = () => resolve(null);
      });
    };

    const drawFrame = (index: number) => {
      const img = imageCache.current.get(index);
      if (!img || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cover scaling
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (canvas.width - img.width * ratio) / 2;
      const centerShiftY = (canvas.height - img.height * ratio) / 2;

      ctx.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShiftX,
        centerShiftY,
        img.width * ratio,
        img.height * ratio
      );
    };

    // Preload initial batch
    preloadImage(0).then((img) => {
      if (img) {
        drawFrame(0);
        setIsLoaded(true);
      }
    });

    // Background preload
    for (let i = 1; i < Math.min(manifest.length, 60); i++) {
      preloadImage(i);
    }

    // Scroll scrubbing listener
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const scrollProgress = Math.min(1, Math.max(0, window.scrollY / scrollHeight));
      const targetFrame = Math.floor(scrollProgress * (manifest.length - 1));
      
      setCurrentFrame(targetFrame);
      if (imageCache.current.has(targetFrame)) {
        requestAnimationFrame(() => drawFrame(targetFrame));
      } else {
        preloadImage(targetFrame).then(() => {
          requestAnimationFrame(() => drawFrame(targetFrame));
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [manifest, currentFrame]);

  const rolesList: {
    id: Role;
    name: string;
    badge: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'MP',
      name: 'Member of Parliament',
      badge: 'Constituency Recommender',
      desc: 'Formulate civic priority recommendations up to ₹5.00 Cr annual statutory quota, track constituency progress.',
      icon: <Landmark className="w-5 h-5 text-amber-600" />,
      color: 'border-amber-200 hover:border-amber-400 bg-white/90',
    },
    {
      id: 'DA',
      name: 'District Authority',
      badge: 'Statutory Sanctions & 10% Inspection',
      desc: 'District Collector sanction desk, administrative sanction, 10% mandatory field inspection audits.',
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
      color: 'border-blue-200 hover:border-blue-400 bg-white/90',
    },
    {
      id: 'IA',
      name: 'Implementing Agency',
      badge: '100% Field Register & CameraX',
      desc: 'PWD / CPWD / ZP field execution register, milestone tracking, 100% inspection returns & photo uploads.',
      icon: <Compass className="w-5 h-5 text-emerald-600" />,
      color: 'border-emerald-200 hover:border-emerald-400 bg-white/90',
    },
    {
      id: 'STATE',
      name: 'State Nodal Department',
      badge: '1% Inter-District Benchmark',
      desc: 'State planning department oversight, inter-district benchmarking radar, unspent balance management.',
      icon: <Scale className="w-5 h-5 text-purple-600" />,
      color: 'border-purple-200 hover:border-purple-400 bg-white/90',
    },
    {
      id: 'MOSPI',
      name: 'MoSPI Central Ministry',
      badge: 'National Apex & 1% RBA Engine',
      desc: 'Central ministry apex governance, risk-based audit sample scheduling, Form 12-C utilization certificate releases.',
      icon: <ShieldCheck className="w-5 h-5 text-slate-800" />,
      color: 'border-slate-300 hover:border-slate-500 bg-white/90',
    },
  ];

  return (
    <div className="relative min-h-[400vh] bg-slate-950 text-slate-100 font-sans selection:bg-slate-800 selection:text-white">
      {/* 480-Frame Canvas Background Scrubbing Engine */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full object-cover pointer-events-none opacity-40 mix-blend-screen z-0"
      />

      {/* Floating HUD Sequence Scrubbing Indicator */}
      <div className="fixed top-20 right-5 z-50 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-full text-xs font-mono text-slate-300 shadow-2xl flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>SCENE 480 HUD</span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-400 font-semibold">
          FRAME {String(currentFrame + 1).padStart(3, '0')} / {manifest.length || 480}
        </span>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-white to-emerald-600 flex items-center justify-center p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-widest text-white uppercase">M.A.R.G.A.</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  STATUTORY 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                MoSPI MPLADS 2023 Digital Governance & Accountability Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-full">
                <span className="text-xs text-slate-300">
                  Active: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role})
                </span>
                <button
                  onClick={onProceedToDashboard}
                  className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Enter Portal
                </button>
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <a
                href="#roles-section"
                className="px-4 py-1.5 text-xs font-bold rounded-full bg-slate-100 hover:bg-white text-slate-900 transition-all shadow-md flex items-center gap-1.5"
              >
                Access Statutory Gateway
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Content Scrollytelling Panels */}
      <div className="relative z-10 pt-32 pb-40 max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col justify-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-6 w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Viksit Bharat 2047 Civic Infrastructure Initiative
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Transparent, Verified <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400 bg-clip-text text-transparent">
              Constituency Infrastructure
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            MARGA (Monitoring, Audit, Review & Governance Architecture) operationalizes the 2023 MoSPI MPLADS Guidelines 
            into a deterministic, multi-role digital pipeline featuring native CameraX geotagging, 3-layer NLP Annexure-II compliance, 
            and LightGBM civil works cost validation.
          </p>

          {/* National Outlay Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
            <div>
              <span className="text-2xl font-black text-white">774</span>
              <p className="text-xs text-slate-400 mt-1">MPs Tracked (LS + RS)</p>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-400">₹4,000 Cr</span>
              <p className="text-xs text-slate-400 mt-1">Annual Scheme Outlay</p>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-400">88,604</span>
              <p className="text-xs text-slate-400 mt-1">Works Recommended</p>
            </div>
            <div>
              <span className="text-2xl font-black text-blue-400">45,679</span>
              <p className="text-xs text-slate-400 mt-1">Verified Completions</p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <a
              href="#roles-section"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              Launch Statutory Role Portal
            </a>
            <span className="text-xs text-slate-400 font-medium">
              ↓ Scroll down to explore the 480-frame visual journey
            </span>
          </div>
        </section>

        {/* Story Chapter 1: The Mandate & Tri-Party Topology */}
        <section className="min-h-[70vh] flex flex-col justify-center max-w-2xl my-24 p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" />
            Chapter I: Statutory Mandate
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Strict Multi-Tier Separation of Powers
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Unlike unified portals, MARGA enforces statutory role separation. MPs exclusively formulate recommendations 
            without execution authority. District Authorities (Collectors) conduct mandatory 10% on-site inspections and 
            sanction releases. Implementing Agencies hold 100% field return obligations. State and Central authorities maintain 1% risk-based meta audits.
          </p>
          <div className="mt-6 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Immutable zero-crossover role guardrails</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Autonomous DNS resilience with local persistent JSON fallback</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>GFR 2017 Rule 238 & Form 12-C utilization certificate tracking</span>
            </div>
          </div>
        </section>

        {/* Story Chapter 2: MARGA Eyes Native CameraX Geotagging */}
        <section className="min-h-[70vh] flex flex-col justify-center max-w-2xl my-24 p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-2xl ml-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
            <Eye className="w-4 h-4" />
            Chapter II: MARGA Eyes Android
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Cryptographic Field Ground Truth
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Eliminating fake progress claims with the companion Android Kotlin application. 
            Inspectors capture high-resolution imagery via CameraX, where sub-10m FusedLocation GPS coordinates, 
            statutory watermark plate banners, and hardware EXIF headers are permanently burned into the photo before upload.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <strong className="text-white block mb-1">Burned Watermark Plate</strong>
              <span className="text-slate-400">Timestamp, inspector ID, work ID & coordinates burned onto image matrix.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <strong className="text-white block mb-1">Hardware EXIF Injection</strong>
              <span className="text-slate-400">Standardized GPS latitude, longitude, and altitude tags injected at capture.</span>
            </div>
          </div>
        </section>

        {/* Story Chapter 3: Cognitive AI Brain & Cost Regressor */}
        <section className="min-h-[70vh] flex flex-col justify-center max-w-2xl my-24 p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
            <Cpu className="w-4 h-4" />
            Chapter III: AI Brain & NLP
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Predictive Cost Validation & Annexure-II Compliance
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            The FastAPI intelligence service combines a 3-layer NLP compliance engine (Deterministic Regex + SentenceTransformers + spaCy NER) 
            to block prohibited works under Annexure-II clauses (commercial complexes, religious structures, recurring costs). 
            A LightGBM gradient boosting regressor computes fair cost bands with TreeSHAP waterfall explanations to flag DA cost inflation.
          </p>
        </section>

        {/* Role Portal Gateway Section */}
        <section id="roles-section" className="min-h-screen flex flex-col justify-center pt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-3">
              Role-Based Authentication Gateway
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Select Your Statutory Authority
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Each portal is strictly scoped to its statutory statutory functions under the 2023 MPLADS guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
            {rolesList.map((role) => (
              <div
                key={role.id}
                className="group relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-600 p-6 flex flex-col justify-between transition-all hover:scale-[1.02] shadow-xl backdrop-blur-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      {role.icon}
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {role.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {role.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {role.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => onSelectRoleForAuth(role.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:bg-amber-500 group-hover:text-slate-950"
                  >
                    <span>Access {role.id} Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Viksit M.A.R.G.A. — Built in strict accordance with the official MoSPI MPLADS Guidelines (February 2023).</p>
      </footer>
    </div>
  );
};
