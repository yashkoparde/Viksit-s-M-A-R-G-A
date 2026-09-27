import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Role, AuthUser } from '../../types';
import { 
  Landmark, 
  Building2, 
  Compass, 
  Scale, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  LogOut, 
  Eye, 
  Smartphone, 
  Server, 
  BrainCircuit, 
  MapPin, 
  Search,
  Check,
  AlertTriangle,
  XCircle,
  Sparkles,
  Workflow,
  Scan,
  TrendingUp,
  ShieldAlert,
  Bot,
  Radar,
  Gauge
} from 'lucide-react';

interface LandingStorySequenceProps {
  onSelectRoleForAuth: (role: Role) => void;
  onOpenPublicPortal: () => void;
  currentUser: AuthUser | null;
  onProceedToDashboard: () => void;
  onLogout: () => void;
}

export const LandingStorySequence: React.FC<LandingStorySequenceProps> = ({
  onSelectRoleForAuth,
  onOpenPublicPortal,
  currentUser,
  onProceedToDashboard,
  onLogout,
}) => {
  // Background Scrollytelling Inspection Sequence State
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [bgFrame, setBgFrame] = useState<number>(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const manifestRef = useRef<string[]>([]);

  // Selected Ecosystem Pillar
  const [activePillar, setActivePillar] = useState<'portal' | 'eyes' | 'brain'>('brain');

  // Interactive Pathway State (Steps 1 to 4)
  const [activePathwayStep, setActivePathwayStep] = useState<number>(1);
  const [testBudget, setTestBudget] = useState<number>(45); // in Lakhs
  const [isPrivateLand, setIsPrivateLand] = useState<boolean>(false);
  const [selectedBrainModel, setSelectedBrainModel] = useState<number>(0);

  // Frame drawer helper
  const drawImageFit = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih || cw === 0 || ch === 0) return;

    const zoomFactor = 1.35;
    const baseScale = Math.max(cw / iw, ch / ih);
    const scale = baseScale * zoomFactor;
    const nw = iw * scale;
    const nh = ih * scale;
    const cx = (cw - nw) / 2;
    const cy = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, cx, cy, nw, nh);
  };

  // Render on background sequence canvas
  const renderBgFrame = useCallback((frameIdx: number) => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const m = manifestRef.current;
    if (!m || m.length === 0) return;
    const safeIdx = Math.max(0, Math.min(frameIdx, m.length - 1));
    const fileName = m[safeIdx];
    if (!fileName) return;

    if (imageCache.current.has(safeIdx)) {
      drawImageFit(ctx, canvas, imageCache.current.get(safeIdx)!);
      return;
    }

    const img = new Image();
    img.src = `/sequence/${fileName}`;
    img.onload = () => {
      imageCache.current.set(safeIdx, img);
      drawImageFit(ctx, canvas, img);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchManifest = async () => {
      try {
        const res = await fetch('/api/sequence-manifest');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            manifestRef.current = data;
            renderBgFrame(0);
            return;
          }
        }
      } catch {}
      const fallback = Array.from({ length: 251 }, (_, i) => 
        `frame_${String(i + 40).padStart(3, '0')}_delay-0.04s.gif`
      );
      if (active) {
        manifestRef.current = fallback;
        renderBgFrame(0);
      }
    };
    fetchManifest();
    return () => { active = false; };
  }, [renderBgFrame]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) setHasScrolled(true);
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const progress = Math.min(Math.max(window.scrollY / totalHeight, 0), 1);
      const m = manifestRef.current;
      if (m && m.length > 0) {
        const targetFrame = Math.floor(progress * (m.length - 1));
        setBgFrame(targetFrame);
        renderBgFrame(targetFrame);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [renderBgFrame]);

  useEffect(() => {
    if (!isPlayingSequence && !hasScrolled) return;
    const interval = setInterval(() => {
      const m = manifestRef.current;
      if (!m || m.length === 0) return;
      setBgFrame((prev) => {
        const next = (prev + 1) % m.length;
        renderBgFrame(next);
        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [isPlayingSequence, hasScrolled, renderBgFrame]);

  // 5 Specialized Models in MARGA Brain
  const brainModels = [
    {
      num: '01',
      title: 'Inspection Routing & Priority',
      type: 'Anomaly Risk Scoring',
      desc: 'Solves DA 10% inspection coverage by scoring anomalies and routing Collector to high-risk sites.',
      icon: <Compass className="w-5 h-5 text-emerald-400" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30'
    },
    {
      num: '02',
      title: 'Cost & Delay Predictor',
      type: 'Regression Model',
      desc: 'Benchmarks proposals against regional PWD baselines to forecast project delivery and detect overbilling.',
      icon: <TrendingUp className="w-5 h-5 text-rose-400" />,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/30'
    },
    {
      num: '03',
      title: 'Duplicate Radius Detector',
      type: 'Geospatial Model',
      desc: 'Scans existing projects within 500m to prevent double-funding and duplicate sanctions.',
      icon: <Radar className="w-5 h-5 text-purple-400" />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30'
    },
    {
      num: '04',
      title: 'Computer Vision & Geotag Lock',
      type: 'Computer Vision',
      desc: 'Validates satellite coordinates on live CameraX photos and strictly stops phone gallery uploads.',
      icon: <Scan className="w-5 h-5 text-sky-400" />,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/30'
    },
    {
      num: '05',
      title: 'Rule & Clause Classifier',
      type: 'NLP Model',
      desc: 'Instantly screens proposal text to block ineligible or unauthorized works before submission.',
      icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30'
    }
  ];

  // 5 Features in MARGA Portal
  const portalFeatures = [
    { num: '01', title: '5-Tier Role Access', desc: 'Isolates MP recommendations, DA sanctions, and IA execution seamlessly.' },
    { num: '02', title: '₹5 Cr Quota Tracker', desc: 'Live countdown prevents fund lapsing and accelerates capital velocity.' },
    { num: '03', title: 'Cryptographic Audit Trail', desc: 'SHA-256 sequential hashing makes every decision tamper-proof.' },
    { num: '04', title: '1-Click UC Generation', desc: 'Automated Measurement Book and GFR Form 12-C certificates.' },
    { num: '05', title: 'Public Transparency Hub', desc: 'Open citizen access with zero login needed to audit local works.' }
  ];

  // 5 Capabilities in MARGA Eyes
  const eyesFeatures = [
    { num: '01', title: 'Live GPS Hardware Lock', desc: 'Direct satellite coordinate stamp burned onto the image file.' },
    { num: '02', title: 'Anti-Gallery Enforcement', desc: 'Strict live-only capture guarantees physical presence on ground.' },
    { num: '03', title: 'Milestone Progress Proofs', desc: 'Before-work, during-work, and post-completion verified logs.' },
    { num: '04', title: 'Offline-First Field Sync', desc: 'Saves drafts on site and automatically uploads when online.' },
    { num: '05', title: 'Physical vs Financial Sync', desc: 'Locks payments until physical progress milestone is certified.' }
  ];

  const portals = [
    {
      id: 'MP' as Role,
      title: 'Parliament',
      role: 'Member of Parliament',
      desc: 'Recommend community works and track constituency progress.',
      icon: <Landmark className="w-6 h-6 text-amber-400" />,
      color: 'border-amber-500/30 hover:border-amber-400',
      btn: 'Authorize MP',
      pin: 'PIN: 1111',
    },
    {
      id: 'DA' as Role,
      title: 'District',
      role: 'District Authority',
      desc: 'Verify public land, issue sanctions, and audit project quality.',
      icon: <Building2 className="w-6 h-6 text-blue-400" />,
      color: 'border-blue-500/30 hover:border-blue-400',
      btn: 'Authorize District',
      pin: 'PIN: 2222',
    },
    {
      id: 'IA' as Role,
      title: 'Field Engine',
      role: 'Implementing Agency',
      desc: 'Execute construction on site and record live geotagged photos.',
      icon: <Compass className="w-6 h-6 text-emerald-400" />,
      color: 'border-emerald-500/30 hover:border-emerald-400',
      btn: 'Authorize Agency',
      pin: 'PIN: 3333',
    },
    {
      id: 'STATE' as Role,
      title: 'State Nodal',
      role: 'State Department',
      desc: 'Monitor district performance and prevent funds from expiring.',
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      color: 'border-purple-500/30 hover:border-purple-400',
      btn: 'Authorize State',
      pin: 'PIN: 4444',
    },
    {
      id: 'MOSPI' as Role,
      title: 'Central HQ',
      role: 'MoSPI Ministry',
      desc: 'Apex macro monitor across all 774 parliamentary portfolios.',
      icon: <Scale className="w-6 h-6 text-rose-400" />,
      color: 'border-rose-500/30 hover:border-rose-400',
      btn: 'Authorize Central',
      pin: 'PIN: 5555',
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Background Cinematic Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <canvas
          ref={bgCanvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-cover filter contrast-[1.08] brightness-[0.75] saturate-[1.15]"
        />
        <div className="absolute inset-0 bg-slate-950/80 pointer-events-none" />
      </div>

      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-slate-950/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-lg flex items-center justify-center font-mono shadow-lg shadow-emerald-500/20">
              M
            </div>
            <span className="text-xl font-black text-white tracking-widest font-mono">MARGA</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPublicPortal}
              className="px-4 py-2 text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Public Gateway</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-1.5 pl-4">
                <span className="text-xs text-slate-300 font-bold">
                  {currentUser.name}
                </span>
                <button
                  onClick={onProceedToDashboard}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer"
                >
                  Enter Portal
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <a
                href="#portals"
                className="px-5 py-2.5 text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg flex items-center gap-2 cursor-pointer font-sans"
              >
                <span>Select Portal</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-24 max-w-7xl mx-auto px-6 space-y-32">
        {/* ========================================================================= */}
        {/* THE MARGA ECOSYSTEM (INTERACTIVE PILLARS + 5 MODELS SHOWCASE)             */}
        {/* ========================================================================= */}
        <section id="ecosystem" className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase">
              THE MARGA ECOSYSTEM
            </h2>
            <p className="mt-3 text-base text-slate-400">
              Three synchronized systems powering zero-leakage governance.
            </p>
          </div>

          {/* Interactive 3 Pillars Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* MARGA Portal */}
            <div 
              onClick={() => setActivePillar('portal')}
              className={`p-8 rounded-3xl border transition-all duration-300 cursor-pointer bg-slate-950/90 backdrop-blur-xl ${
                activePillar === 'portal' 
                  ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20 ring-1 ring-emerald-500 scale-[1.02]' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Server className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                  Web Platform
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">MARGA Portal</h3>
              <p className="text-sm font-bold text-emerald-400 mt-1">Multi-Tier Command Desk</p>
              <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                Connects MPs, District Collectors, and Engineers with real-time budget velocity and fast sanction approvals.
              </p>
            </div>

            {/* MARGA Eyes */}
            <div 
              onClick={() => setActivePillar('eyes')}
              className={`p-8 rounded-3xl border transition-all duration-300 cursor-pointer bg-slate-950/90 backdrop-blur-xl ${
                activePillar === 'eyes' 
                  ? 'border-sky-500 shadow-2xl shadow-sky-500/20 ring-1 ring-sky-500 scale-[1.02]' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  <Smartphone className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-500/20 text-sky-300">
                  Mobile CameraX
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">MARGA Eyes</h3>
              <p className="text-sm font-bold text-sky-400 mt-1">Ground Camera Engine</p>
              <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                Mobile camera app that burns satellite GPS coordinates directly into milestone photos. Blocks gallery uploads.
              </p>
            </div>

            {/* MARGA Brain */}
            <div 
              onClick={() => setActivePillar('brain')}
              className={`p-8 rounded-3xl border transition-all duration-300 cursor-pointer bg-slate-950/90 backdrop-blur-xl ${
                activePillar === 'brain' 
                  ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 ring-1 ring-indigo-500 scale-[1.02]' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
                  5 ML Models
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">MARGA Brain</h3>
              <p className="text-sm font-bold text-indigo-400 mt-1">Predictive & Guardrails Layer</p>
              <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                Predictive AI models that pre-screen proposals, forecast delays, detect photo tampering, and cluster citizen demands.
              </p>
            </div>
          </div>

          {/* Interactive Feature & Model Showcase Box */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-950/95 border border-slate-800 backdrop-blur-2xl shadow-2xl">
            
            {/* Header Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Interactive System Inspector
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {activePillar === 'brain' && 'The 5 Models Inside MARGA Brain'}
                  {activePillar === 'eyes' && 'The 5 Capabilities of MARGA Eyes'}
                  {activePillar === 'portal' && 'The 5 Core Modules of MARGA Portal'}
                </h3>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActivePillar('brain')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePillar === 'brain' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  MARGA Brain
                </button>
                <button
                  onClick={() => setActivePillar('eyes')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePillar === 'eyes' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  MARGA Eyes
                </button>
                <button
                  onClick={() => setActivePillar('portal')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePillar === 'portal' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  MARGA Portal
                </button>
              </div>
            </div>

            {/* MARGA Brain: 5 Models Interactive Grid */}
            {activePillar === 'brain' && (
              <div className="mt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {brainModels.map((model, idx) => (
                    <div
                      key={model.num}
                      onClick={() => setSelectedBrainModel(idx)}
                      className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-3 ${
                        selectedBrainModel === idx
                          ? `${model.bg} ring-1 ring-indigo-500 shadow-xl scale-[1.03]`
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-indigo-400">MODEL {model.num}</span>
                        {selectedBrainModel === idx && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <h4 className="text-base font-bold text-white leading-snug">{model.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{model.type}</p>
                    </div>
                  ))}
                </div>

                {/* Selected Model Focus Card */}
                {brainModels[selectedBrainModel] && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                          {brainModels[selectedBrainModel].icon}
                        </div>
                        <div>
                          <span className="text-xs font-mono text-indigo-400 font-bold uppercase">
                            Model {brainModels[selectedBrainModel].num} Details
                          </span>
                          <h4 className="text-lg font-bold text-white">{brainModels[selectedBrainModel].title}</h4>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                        {brainModels[selectedBrainModel].desc}
                      </p>
                    </div>

                    <div className="px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-center shrink-0">
                      <span className="text-xs text-slate-400 block font-mono">Engine Type</span>
                      <span className="text-sm font-bold text-indigo-300 font-mono mt-0.5 block">
                        {brainModels[selectedBrainModel].type}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MARGA Eyes: 5 Capabilities Grid */}
            {activePillar === 'eyes' && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
                {eyesFeatures.map((item) => (
                  <div key={item.num} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-sky-400">FEATURE {item.num}</span>
                    <h4 className="text-base font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* MARGA Portal: 5 Modules Grid */}
            {activePillar === 'portal' && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
                {portalFeatures.map((item) => (
                  <div key={item.num} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">MODULE {item.num}</span>
                    <h4 className="text-base font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* HOW A PROJECT MOVES FORWARD (ANIMATED & HIGHLY INTERACTIVE)              */}
        {/* ========================================================================= */}
        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase">
              HOW A PROJECT MOVES FORWARD
            </h2>
            <p className="mt-3 text-base text-slate-400">
              Interactive simulator demonstrating honest delivery from start to finish.
            </p>
          </div>

          {/* 4 Interactive Step Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { num: 1, title: '01 · Suggest', subtitle: 'Public Need & MP Recommendation' },
              { num: 2, title: '02 · Sanction', subtitle: 'District Land & Rule Screening' },
              { num: 3, title: '03 · Build', subtitle: 'Ground Execution & GPS Photo Lock' },
              { num: 4, title: '04 · Deliver', subtitle: 'Audit Certified & Public Handover' },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setActivePathwayStep(s.num)}
                className={`p-6 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                  activePathwayStep === s.num
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xl scale-[1.02]'
                    : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className={`text-lg font-black font-mono ${activePathwayStep === s.num ? 'text-slate-950' : 'text-emerald-400'}`}>
                  {s.title}
                </div>
                <div className={`text-xs mt-2 font-medium ${activePathwayStep === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s.subtitle}
                </div>
              </button>
            ))}
          </div>

          {/* Interactive Step Simulator Arena */}
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-950/95 border border-slate-800 backdrop-blur-2xl shadow-2xl">
            
            {/* Step 1: Interactive Cost Slider Simulator */}
            {activePathwayStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                    Step 01 · Recommendation
                  </span>
                  <h3 className="text-3xl font-black text-white">Community Idea & AI Budget Baseline</h3>
                  <p className="text-base text-slate-300 leading-relaxed">
                    Citizens request a drinking water plant. The MP recommends the project, and MARGA Brain Model 02 automatically validates the proposed budget against regional baselines.
                  </p>
                </div>

                {/* Interactive Slider Widget */}
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold">Adjust Proposed Budget:</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">₹{testBudget} Lakhs</span>
                  </div>

                  <input
                    type="range"
                    min={10}
                    max={120}
                    value={testBudget}
                    onChange={(e) => setTestBudget(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer h-2.5 bg-slate-800 rounded-lg appearance-none"
                  />

                  <div className="flex justify-between text-xs text-slate-500 font-mono">
                    <span>₹10L (Small)</span>
                    <span>₹45L (Standard Baseline)</span>
                    <span>₹120L (High)</span>
                  </div>

                  <div className={`p-4 rounded-xl border text-sm transition-all duration-200 flex items-center gap-3 ${
                    testBudget > 80 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}>
                    {testBudget > 80 ? (
                      <>
                        <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                        <div>
                          <span className="font-bold block">Flagged: High Cost Outlier</span>
                          <span className="text-xs text-rose-400">Exceeds standard ₹45L baseline. Scrutiny triggered.</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-bold block">Verified: Within Normal Baseline</span>
                          <span className="text-xs text-emerald-400">Ready for District administrative sanction.</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Interactive Land Toggle Simulator */}
            {activePathwayStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold text-blue-400 uppercase">
                    Step 02 · Sanction
                  </span>
                  <h3 className="text-3xl font-black text-white">District Verification & Eligibility</h3>
                  <p className="text-base text-slate-300 leading-relaxed">
                    The District Authority verifies public land ownership. MARGA Brain Model 01 blocks funds from being diverted to private or commercial properties.
                  </p>
                </div>

                {/* Interactive Toggle Widget */}
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <span className="text-xs text-slate-400 font-bold block">Test Land Ownership Rule:</span>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-sm text-slate-300">Is this project on private trust land?</span>
                    <button
                      onClick={() => setIsPrivateLand(!isPrivateLand)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isPrivateLand ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {isPrivateLand ? 'YES (Private Land)' : 'NO (Public Gram Panchayat)'}
                    </button>
                  </div>

                  <div className={`p-4 rounded-xl border text-sm transition-all duration-200 flex items-center gap-3 ${
                    isPrivateLand 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}>
                    {isPrivateLand ? (
                      <>
                        <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                        <div>
                          <span className="font-bold block">Sanction Blocked</span>
                          <span className="text-xs text-rose-400">Funds cannot be spent on private properties. Public money protected.</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-bold block">Sanction Approved (AS / TS Issued)</span>
                          <span className="text-xs text-emerald-400">Work assigned to District Engineering Wing.</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Simulated Live Camera HUD */}
            {activePathwayStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold text-sky-400 uppercase">
                    Step 03 · Execution
                  </span>
                  <h3 className="text-3xl font-black text-white">Live Ground Proof via MARGA Eyes</h3>
                  <p className="text-base text-slate-300 leading-relaxed">
                    Field engineers capture milestone progress on site. The app locks satellite GPS coordinates into image EXIF metadata. No gallery uploads allowed.
                  </p>
                </div>

                {/* Viewfinder HUD */}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex flex-col justify-between p-5">
                    <div className="flex justify-between items-center z-10">
                      <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        LIVE CAMERAX LOCK
                      </span>
                      <span className="text-xs font-mono text-slate-400">GPS ACCURACY ±3M</span>
                    </div>

                    <div className="relative z-10 space-y-1 bg-slate-900/90 p-3 rounded-xl border border-slate-800 backdrop-blur-md">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono font-bold">
                        <MapPin className="w-4 h-4" />
                        <span>GPS: 12.3051° N, 76.6551° E · Mysuru</span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">Timestamp: Live Verified On Ground</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Completion & Handover */}
            {activePathwayStep === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                    Step 04 · Handover
                  </span>
                  <h3 className="text-3xl font-black text-white">Public Audit & Asset Delivery</h3>
                  <p className="text-base text-slate-300 leading-relaxed">
                    Mandatory 10% spot audit is completed. The project is certified, handed over to the community, and published on the open public ledger.
                  </p>
                </div>

                {/* Handover Card */}
                <div className="bg-slate-900 p-8 rounded-2xl border border-emerald-500/40 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-black text-white">Asset Handed Over to Public</h4>
                  <p className="text-sm text-slate-300 max-w-sm mx-auto">
                    Clean drinking water active. 100% public transparency recorded on central ledger.
                  </p>
                  <a
                    href="#portals"
                    className="inline-flex items-center gap-2 mt-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all cursor-pointer shadow-lg"
                  >
                    <span>Explore Portals</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* STAKEHOLDER PORTALS (CLEAN & DIRECT CARDS)                                */}
        {/* ========================================================================= */}
        <section id="portals" className="space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase">
              STAKEHOLDER PORTALS
            </h2>
            <p className="mt-3 text-base text-slate-400">
              Select your authority workspace to continue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portals.map((p) => (
              <div
                key={p.id}
                className={`p-8 rounded-3xl bg-slate-950/90 border ${p.color} transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      {p.icon}
                    </div>
                    <span className="text-xs font-mono text-slate-400">{p.pin}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-white">{p.title}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{p.role}</p>
                  <p className="text-sm text-slate-300 mt-4 leading-relaxed">{p.desc}</p>
                </div>

                <button
                  onClick={() => onSelectRoleForAuth(p.id)}
                  className="mt-8 w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-500 text-white hover:text-slate-950 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-800 hover:border-emerald-400"
                >
                  <span>{p.btn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Public Citizen Card */}
            <div className="p-8 rounded-3xl bg-slate-950/90 border border-teal-500/30 hover:border-teal-400 transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-teal-400">
                    <Eye className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono text-teal-400 font-bold">Open Access</span>
                </div>

                <h3 className="text-2xl font-bold text-white">Public Citizen</h3>
                <p className="text-xs font-semibold text-teal-400 mt-0.5">Community Transparency</p>
                <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                  Search sanctioned works, inspect live photo proof, and submit local project suggestions.
                </p>
              </div>

              <button
                onClick={onOpenPublicPortal}
                className="mt-8 w-full py-3.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <span>Inspect Public Works</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-900 py-10 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-bold text-white font-mono tracking-wider">MARGA</span>
          <p className="text-slate-400">
            Open Civic Infrastructure · Real Ground Truth
          </p>
        </div>
      </footer>
    </div>
  );
};
