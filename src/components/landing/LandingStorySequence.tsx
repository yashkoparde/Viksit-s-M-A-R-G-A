import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Cpu,
  ChevronDown
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
  const [isReady, setIsReady] = useState<boolean>(false);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const manifestRef = useRef<string[]>([]);
  const isTicking = useRef<boolean>(false);
  const currentFrameRef = useRef<number>(0);

  // Fetch sequence manifest
  useEffect(() => {
    let active = true;
    const fetchManifest = async () => {
      try {
        const res = await fetch('/api/sequence-manifest');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            manifestRef.current = data;
            setManifest(data);
            return;
          }
        }
      } catch (err) {
        console.warn('Using fallback sequence list', err);
      }

      // Default fallback
      const fallback = Array.from({ length: 480 }, (_, i) => 
        `frame_${String(i).padStart(3, '0')}_delay-0.04s.gif`
      );
      if (active) {
        manifestRef.current = fallback;
        setManifest(fallback);
      }
    };
    fetchManifest();
    return () => { active = false; };
  }, []);

  // Nearest frame fallback finder
  const findNearest = useCallback((index: number): HTMLImageElement | null => {
    if (imageCache.current.has(index)) return imageCache.current.get(index)!;
    for (let dist = 1; dist < 80; dist++) {
      if (imageCache.current.has(index - dist)) return imageCache.current.get(index - dist)!;
      if (imageCache.current.has(index + dist)) return imageCache.current.get(index + dist)!;
    }
    return imageCache.current.get(0) || null;
  }, []);

  // High-performance image render using 5-arg drawImage (avoiding source slice bugs with GIFs)
  const renderImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih || cw === 0 || ch === 0) return;

    // Cover aspect ratio
    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, cx, cy, nw, nh);
  }, []);

  // Preload single image helper
  const preloadImage = useCallback((index: number): Promise<HTMLImageElement | null> => {
    if (imageCache.current.has(index)) {
      return Promise.resolve(imageCache.current.get(index)!);
    }
    const frames = manifestRef.current;
    if (!frames.length || index < 0 || index >= frames.length) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `/sequence/${frames[index]}`;
      img.onload = () => {
        imageCache.current.set(index, img);
        resolve(img);
      };
      img.onerror = () => {
        resolve(null);
      };
    });
  }, []);

  // Draw frame with nearest fallback
  const drawFrame = useCallback((index: number) => {
    const directImg = imageCache.current.get(index);
    if (directImg) {
      renderImage(directImg);
    } else {
      const fallback = findNearest(index);
      if (fallback) {
        renderImage(fallback);
      }
      preloadImage(index).then((loaded) => {
        if (loaded && currentFrameRef.current === index) {
          renderImage(loaded);
        }
      });
    }
  }, [findNearest, preloadImage, renderImage]);

  // Main canvas initialization and scroll listener
  useEffect(() => {
    if (!manifest.length || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      drawFrame(currentFrameRef.current);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Preload first 20 frames immediately for instant smoothness
    preloadImage(0).then((img) => {
      if (img) {
        renderImage(img);
        setIsReady(true);
      }
    });

    for (let i = 1; i < Math.min(manifest.length, 30); i++) {
      preloadImage(i);
    }

    // Scroll scrubbing listener
    const onScroll = () => {
      if (isTicking.current) return;
      isTicking.current = true;

      requestAnimationFrame(() => {
        const docHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight
        );
        const winHeight = window.innerHeight;
        const maxScroll = Math.max(1, docHeight - winHeight);
        const scrollFraction = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        
        const total = manifestRef.current.length || 1;
        const targetFrame = Math.min(total - 1, Math.floor(scrollFraction * total));

        currentFrameRef.current = targetFrame;
        setCurrentFrame(targetFrame);
        drawFrame(targetFrame);

        // Preload next 10 forward frames
        for (let f = targetFrame + 1; f < Math.min(total, targetFrame + 10); f++) {
          if (!imageCache.current.has(f)) preloadImage(f);
        }

        isTicking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', onScroll);
    };
  }, [manifest, drawFrame, preloadImage, renderImage]);

  const rolesList: {
    id: Role;
    name: string;
    badge: string;
    desc: string;
    icon: React.ReactNode;
    badgeColor: string;
    borderColor: string;
  }[] = [
    {
      id: 'MP',
      name: 'Member of Parliament',
      badge: 'Lok Sabha / Rajya Sabha',
      desc: 'Formulate community infrastructure recommendations up to ₹5.00 Cr annual statutory quota. Zero execution authority.',
      icon: <Landmark className="w-5 h-5 text-indigo-400" />,
      badgeColor: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/60',
      borderColor: 'hover:border-indigo-500/80',
    },
    {
      id: 'DA',
      name: 'District Authority',
      badge: 'District Collector / DM',
      desc: 'Scrutinize MP recommendations, grant administrative sanctions, and conduct mandatory 10% annual field verification.',
      icon: <Building2 className="w-5 h-5 text-amber-400" />,
      badgeColor: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
      borderColor: 'hover:border-amber-500/80',
    },
    {
      id: 'IA',
      name: 'Implementing Agency',
      badge: 'PWD / CPWD / ZP',
      desc: 'On-ground technical execution, Measurement Book entries, and mandatory 100% field inspection returns with CameraX.',
      icon: <Compass className="w-5 h-5 text-emerald-400" />,
      badgeColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
      borderColor: 'hover:border-emerald-500/80',
    },
    {
      id: 'STATE',
      name: 'State Nodal Dept',
      badge: 'Planning & Rural Dev',
      desc: 'State-level oversight, inter-district benchmarking radar, unspent balance management, and 1% sample physical audits.',
      icon: <Scale className="w-5 h-5 text-blue-400" />,
      badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700/60',
      borderColor: 'hover:border-blue-500/80',
    },
    {
      id: 'MOSPI',
      name: 'MoSPI Central Ministry',
      badge: 'GoI National Apex',
      desc: 'Apex governance, tranche release approvals, GFR 2017 Rule 238 Form 12-C UCs, and 1% Risk-Based Meta-Audits (RBA).',
      icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
      badgeColor: 'bg-purple-900/60 text-purple-300 border-purple-700/60',
      borderColor: 'hover:border-purple-500/80',
    },
  ];

  return (
    <div className="relative min-h-[450vh] bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* 480-Frame Fixed Canvas Background */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
        />
        {/* Subtle cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950/90 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(8,11,18,0.3)_0%,_rgba(8,11,18,0.85)_75%,_rgba(8,11,18,0.98)_100%)] pointer-events-none" />
      </div>

      {/* Tricolor Government Header Stripe */}
      <div className="fixed top-0 inset-x-0 h-1 z-50 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* Floating HUD Scrubbing Indicator */}
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 px-4 py-2.5 rounded-full text-xs font-mono text-slate-200 shadow-2xl flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold tracking-wider text-slate-300">STORYBOARD HUD</span>
        <span className="text-slate-600">|</span>
        <span className="text-emerald-400 font-bold">
          FRAME {String(currentFrame + 1).padStart(3, '0')} / {manifest.length || 480}
        </span>
        <span className="text-slate-500">
          ({Math.round(((currentFrame + 1) / (manifest.length || 480)) * 100)}%)
        </span>
      </div>

      {/* Sticky Civic Header */}
      <header className="fixed top-1 inset-x-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-white to-emerald-600 flex items-center justify-center p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-widest text-white uppercase">M.A.R.G.A.</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  MoSPI MPLADS 2023
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Monitoring, Audit, Review & Governance Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 px-3.5 py-1.5 rounded-full shadow-inner">
                <span className="text-xs text-slate-300">
                  Active: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role})
                </span>
                <button
                  onClick={onProceedToDashboard}
                  className="px-3.5 py-1 text-xs font-bold rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md cursor-pointer"
                >
                  Enter Portal →
                </button>
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onSelectRoleForAuth('MP')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Role Login / Auth</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <a
                  href="#roles-section"
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all hidden md:flex items-center gap-1.5"
                >
                  <span>5 Portals</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Scrollytelling Panels */}
      <main className="relative z-10 pt-36 pb-32 max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col justify-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold mb-6 w-fit shadow-lg backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            Viksit Bharat 2047 · Digital Governance & Transparency
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Transparent, Verified <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400 bg-clip-text text-transparent">
              Constituency Infrastructure
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl font-normal drop-shadow-sm">
            MARGA transforms public capital deployment across all 774 parliamentary constituencies through a statutory, 
            multi-tier governance architecture with CameraX native geotagging, 3-layer NLP compliance, and LightGBM civil works cost validation.
          </p>

          {/* National Live Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-xl shadow-2xl">
            <div>
              <span className="text-2xl font-black text-white">774</span>
              <p className="text-xs text-slate-400 mt-1">MPs Tracked (LS + RS)</p>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-400">₹ 4,000 Cr</span>
              <p className="text-xs text-slate-400 mt-1">Annual Scheme Outlay</p>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-400">130,882</span>
              <p className="text-xs text-slate-400 mt-1">Official Works Registered</p>
            </div>
            <div>
              <span className="text-2xl font-black text-indigo-400">36</span>
              <p className="text-xs text-slate-400 mt-1">States & UTs Covered</p>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onSelectRoleForAuth('MP')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-sm transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] flex items-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Launch Statutory Portal Gateway</span>
            </button>
            <a
              href="#roles-section"
              className="px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold transition-all flex items-center gap-2"
            >
              <span>Explore 5 Roles</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
            <span className="text-xs text-slate-400 font-medium">
              ↓ Scroll down to scrub the 480-frame visual inspection story
            </span>
          </div>
        </section>

        {/* Story Chapter 1: The Mandate & Separation of Powers */}
        <section className="min-h-[75vh] flex flex-col justify-center max-w-2xl my-32 p-8 sm:p-10 rounded-3xl bg-slate-900/85 border border-slate-800/90 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" />
            Chapter I: Statutory Mandate
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Strict Multi-Tier Separation of Powers
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            In compliance with the <strong>February 2023 MoSPI MPLADS Guidelines</strong>, MARGA strictly enforces operational 
            checks-and-balances. MPs exclusively formulate priority recommendations up to ₹5.00 Cr annually with zero execution power. 
            District Authorities conduct mandatory <strong>10% field inspection audits</strong>, while Implementing Agencies fulfill 
            <strong>100% field return obligations</strong> with hardware geotagged evidence.
          </p>
          <div className="mt-6 space-y-3 text-xs text-slate-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero-crossover role security preventing unauthorized action invocation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Autonomous MongoDB Atlas connection pooling with persistent JSON fallback</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>GFR 2017 Rule 238(1) Form 12-C utilization certificates & unspent balance ledger</span>
            </div>
          </div>
        </section>

        {/* Story Chapter 2: MARGA Eyes Native CameraX Geotagging */}
        <section className="min-h-[75vh] flex flex-col justify-center max-w-2xl my-32 p-8 sm:p-10 rounded-3xl bg-slate-900/85 border border-slate-800/90 backdrop-blur-xl shadow-2xl ml-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
            <Eye className="w-4 h-4" />
            Chapter II: MARGA Eyes Mobile
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Cryptographic Field Ground Truth
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            The companion native Android Kotlin application (<code className="text-emerald-400 font-mono">marga-eyes/</code>) eliminates ghost projects. 
            Junior engineers capture inspection evidence via CameraX, where sub-10m FusedLocation GPS coordinates, 
            statutory watermark plate banners, and hardware EXIF headers are permanently burned directly into the image matrix before transmission.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
              <strong className="text-white block mb-1">Burnt Watermark Plate</strong>
              <span className="text-slate-400">Timestamp, inspector ID, work ID, and coordinates burned directly onto pixels.</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
              <strong className="text-white block mb-1">Hardware EXIF Injection</strong>
              <span className="text-slate-400">Standardized GPS latitude, longitude, and altitude tags injected at capture.</span>
            </div>
          </div>
        </section>

        {/* Story Chapter 3: Cognitive AI Brain & Cost Regressor */}
        <section className="min-h-[75vh] flex flex-col justify-center max-w-2xl my-32 p-8 sm:p-10 rounded-3xl bg-slate-900/85 border border-slate-800/90 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
            <Cpu className="w-4 h-4" />
            Chapter III: Cognitive AI Brain
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Predictive Cost Validation & Annexure-II Compliance
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            The FastAPI intelligence service combines a 3-layer NLP compliance engine (Deterministic Regex + SentenceTransformers + spaCy NER) 
            to block prohibited works under Annexure-II clauses (commercial complexes, religious structures, recurring maintenance costs). 
            A LightGBM gradient boosting regressor computes fair cost bands with TreeSHAP waterfall explanations to flag DA cost inflation.
          </p>
        </section>

        {/* Role Portal Gateway Section */}
        <section id="roles-section" className="min-h-screen flex flex-col justify-center pt-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold mb-3">
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
                className={`group relative rounded-2xl bg-slate-900/90 border border-slate-800 ${role.borderColor} p-6 flex flex-col justify-between transition-all hover:scale-[1.02] shadow-xl backdrop-blur-xl`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-md">
                      {role.icon}
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${role.badgeColor}`}>
                      {role.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {role.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-normal">
                    {role.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => onSelectRoleForAuth(role.id)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-amber-500 text-white hover:text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md group-hover:shadow-lg"
                  >
                    <span>Authorize as {role.id}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-800/80 py-10 px-6 text-center text-xs text-slate-500">
        <p className="max-w-2xl mx-auto leading-relaxed">
          © 2026 Viksit M.A.R.G.A. — Built in strict compliance with the official Ministry of Statistics and Programme Implementation (MoSPI) MPLADS Guidelines (February 2023).
        </p>
      </footer>
    </div>
  );
};
