import React, { useState, useEffect } from 'react';
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
    accentColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    role: 'DA',
    label: 'District Authority',
    badge: 'Deputy Commissioner / DM',
    icon: Building2,
    accentColor: 'text-slate-800 bg-slate-100 border-slate-300',
  },
  {
    role: 'IA',
    label: 'Implementing Agency',
    badge: 'PWD / MUDA / ZP',
    icon: HardHat,
    accentColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    role: 'STATE',
    label: 'State Nodal Dept',
    badge: 'Govt. of Karnataka',
    icon: ShieldCheck,
    accentColor: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    role: 'MOSPI',
    label: 'Central Ministry',
    badge: 'GoI National HQ',
    icon: FileCheck2,
    accentColor: 'text-slate-900 bg-slate-100 border-slate-300',
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

  // Supabase connection health
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(true);
  const [supabaseLatency, setSupabaseLatency] = useState<number | null>(null);

  const activeProfile = OFFICIAL_ROLE_PROFILES[selectedRole];

  // Auto-fill role demo default credentials on initial load or role switch if form is empty
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 text-slate-800 antialiased selection:bg-slate-900 selection:text-white">
      {/* Main Authentication Container */}
      <main className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Role Selector & Jurisdiction Context */}
        <div className="lg:col-span-5 bg-slate-50 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              Role-Wise Access Control
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Statutory Portal Sign In
            </h2>

            {/* Role Picker List */}
            <div className="mt-5 space-y-1.5" role="radiogroup" aria-label="Select Operational Role">
              {ROLE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white border-slate-900 shadow-xs ring-1 ring-slate-900 text-slate-900 font-semibold'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center ${
                          isSelected
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.badge}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jurisdiction Detail Card */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">
              {activeProfile.designation}
            </div>
            <div className="text-slate-500">{activeProfile.department}</div>
          </div>
        </div>

        {/* Right Column: Credentials Form */}
        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between">
          <div>
            {/* Form Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeProfile.designation}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your official credentials registered in the database.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
                title="Quick-fill official credentials for this role"
              >
                <Sparkles className="w-3 h-3 text-slate-600" />
                Auto-Fill Demo
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
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
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Officer / Representative Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sri Yaduveer Krishnadatta Chamaraja Wadiyar"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Registration ID / Officer Reg ID */}
              <div>
                <label
                  htmlFor="input-auth-regid"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Registration ID / Officer ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-regid"
                    type="text"
                    required
                    value={regId}
                    onChange={(e) => setRegId(e.target.value)}
                    placeholder={activeProfile.defaultRegId}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-medium border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all uppercase"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="input-auth-password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Security Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  className="flex-1 h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-70 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  className="h-10 px-3 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
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
