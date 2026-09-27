import React, { useState, useEffect } from 'react';
import { CinematicCanvas3D } from '../landing/CinematicCanvas3D';
import { Role, AuthUser } from '../../types';
import {
  OFFICIAL_ROLE_PROFILES,
  loginWithCredentials,
} from '../../services/supabaseClient';
import {
  ShieldCheck,
  Building2,
  Landmark,
  HardHat,
  FileCheck2,
  Eye,
  EyeOff,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface RoleLoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  initialRole?: Role;
}

const ROLE_ITEMS: {
  role: Role;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}[] = [
  {
    role: 'MP',
    label: 'Member of Parliament',
    badge: 'Lok Sabha / Rajya Sabha',
    icon: Landmark,
    accentColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  {
    role: 'DA',
    label: 'District Authority',
    badge: 'Deputy Commissioner / DM',
    icon: Building2,
    accentColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  },
  {
    role: 'IA',
    label: 'Implementing Agency',
    badge: 'PWD / MUDA / ZP',
    icon: HardHat,
    accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    role: 'STATE',
    label: 'State Nodal Dept',
    badge: 'Govt. of Karnataka',
    icon: FileCheck2,
    accentColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  {
    role: 'MOSPI',
    label: 'MoSPI Central Ministry',
    badge: 'Govt. of India',
    icon: ShieldCheck,
    accentColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
];

export const RoleLoginPage: React.FC<RoleLoginPageProps> = ({
  onLoginSuccess,
  initialRole = 'MP',
}) => {
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  const [name, setName] = useState('');
  const [regId, setRegId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeProfile = OFFICIAL_ROLE_PROFILES[selectedRole];

  useEffect(() => {
    const prof = OFFICIAL_ROLE_PROFILES[selectedRole];
    if (prof) {
      setName(prof.defaultName);
      setRegId(prof.defaultRegId);
      setPassword(prof.defaultPassword);
      setErrorMessage(null);
    }
  }, [selectedRole]);

  const handleFillDemo = () => {
    const prof = OFFICIAL_ROLE_PROFILES[selectedRole];
    setName(prof.defaultName);
    setRegId(prof.defaultRegId);
    setPassword(prof.defaultPassword);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setName('');
    setRegId('');
    setPassword('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithCredentials({
        role: selectedRole,
        name,
        regId,
        password,
      });

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Connection error while contacting authorization server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 md:p-8 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white overflow-hidden">
      
      {/* 3D Holographic Constituency Globe Background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-80">
        <CinematicCanvas3D preset="overview" interactive={true} />
      </div>

      {/* Main Authentication Container */}
      <main className="relative z-10 w-full max-w-4xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 text-slate-100">
        {/* Left Column: Role Selector & Jurisdiction Context */}
        <div className="lg:col-span-5 bg-slate-950/70 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-800/90 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 text-[11px] font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Role-Wise Access Control
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Statutory Portal Sign In
            </h2>

            {/* Role Picker List */}
            <div className="mt-5 space-y-2" role="radiogroup" aria-label="Select Operational Role">
              {ROLE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500/50 shadow-md text-white font-semibold'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.badge}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jurisdiction Detail Card */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200">
              {activeProfile.designation}
            </div>
            <div className="text-slate-400">{activeProfile.department}</div>
          </div>
        </div>

        {/* Right Column: Credentials Form */}
        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between bg-slate-900/60">
          <div>
            {/* Form Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeProfile.designation}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your official credentials registered in the database.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors cursor-pointer"
                title="Quick-fill official credentials for this role"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                Auto-Fill Demo
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Authentication Notice: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full / Official Name */}
              <div>
                <label
                  htmlFor="input-auth-name"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Officer / Representative Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sri Yaduveer Krishnadatta Chamaraja Wadiyar"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-700 rounded-xl bg-slate-950/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Registration ID / Officer Reg ID */}
              <div>
                <label
                  htmlFor="input-auth-regid"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Registration ID / Officer ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-regid"
                    type="text"
                    required
                    value={regId}
                    onChange={(e) => setRegId(e.target.value)}
                    placeholder={activeProfile.defaultRegId}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-medium border border-slate-700 rounded-xl bg-slate-950/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all uppercase"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="input-auth-password"
                  className="block text-xs font-semibold text-slate-300 mb-1"
                >
                  Security Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-700 rounded-xl bg-slate-950/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-70 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Authenticating with Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In as {selectedRole}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="h-11 px-4 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
