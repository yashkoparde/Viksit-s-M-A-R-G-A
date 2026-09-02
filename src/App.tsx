import React, { useState, useEffect } from 'react';
import { Role, Work, DistrictStats, Recommendation, ActionLog, NotificationItem, AuthUser } from './types';
import { margaDatabase } from './services/margaDatabase';
import {
  getStoredSession,
  logoutUser,
  OFFICIAL_ROLE_PROFILES,
  SUPABASE_URL,
} from './services/supabaseClient';
import { RoleLoginPage } from './components/auth/RoleLoginPage';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { RolePermissionMatrixModal } from './components/common/RolePermissionMatrixModal';
import { WorkDetailDrawer } from './components/common/WorkDetailDrawer';
import { RiskExplanationModal } from './components/common/RiskExplanationModal';
import { AiAssistantDrawer } from './components/common/AiAssistantDrawer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { AuditLedgerModal } from './components/common/AuditLedgerModal';
import { ReportGeneratorModal } from './components/common/ReportGeneratorModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { Database, RefreshCw, Sparkles } from 'lucide-react';

// Portals for each of the 5 roles
import { MpPortal } from './components/mp/MpPortal';
import { DaPortal } from './components/da/DaPortal';
import { IaPortal } from './components/ia/IaPortal';
import { StatePortal } from './components/state/StatePortal';
import { MospiPortal } from './components/mospi/MospiPortal';
import { LandingStorySequence } from './components/landing/LandingStorySequence';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Active Role State
  const [currentRole, setCurrentRole] = useState<Role>('MP');

  // Chronological Application Stage: 'landing' (first) -> 'auth' (second) -> 'portal' (third)
  const [appStage, setAppStage] = useState<'landing' | 'auth' | 'portal'>('landing');
  const [selectedRoleForAuth, setSelectedRoleForAuth] = useState<Role>('MP');
  const [activeView, setActiveView] = useState<string>('overview');

  // Authoritative Database State
  const [works, setWorks] = useState<Work[]>([]);
  const [districts, setDistricts] = useState<DistrictStats[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  // Modals & Drawers State
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [riskModalWork, setRiskModalWork] = useState<Work | null>(null);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuditLedgerOpen, setIsAuditLedgerOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Toast Action Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live MongoDB Atlas Cluster Status
  const [clusterStatus, setClusterStatus] = useState<{
    connected: boolean;
    database: string;
    cluster: string;
    counts: any;
  } | null>(null);

  const fetchDatabaseRecords = async () => {
    try {
      await margaDatabase.syncWithCluster();
      const [w, d, r, l, n] = await Promise.all([
        margaDatabase.getWorks(),
        margaDatabase.getDistricts(),
        margaDatabase.getRecommendations(),
        margaDatabase.getAuditLogs(),
        margaDatabase.getNotifications(),
      ]);
      setWorks(w);
      setDistricts(d);
      setRecommendations(r);
      setActionLogs(l);
      setNotifications(n);

      // Fetch live MongoDB cluster status
      try {
        const res = await fetch('/api/db-status');
        if (res.ok) {
          const json = await res.json();
          setClusterStatus(json);
        }
      } catch {}
    } catch (err) {
      console.error('Error querying MARGA Database:', err);
    } finally {
      setIsLoadingDb(false);
    }
  };


  useEffect(() => {
    fetchDatabaseRecords();
  }, []);

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    setActiveView('overview');
    if (currentUser) {
      const prof = OFFICIAL_ROLE_PROFILES[role];
      if (prof) {
        const updated: AuthUser = {
          ...currentUser,
          role,
          name: prof.defaultName,
          regId: prof.defaultRegId,
          department: prof.department,
          designation: prof.designation,
        };
        setCurrentUser(updated);
        try {
          localStorage.setItem('marga_authenticated_user_v1', JSON.stringify(updated));
        } catch {}
      }
    }
  };

  // STEP 2 -> STEP 3: Auth Success -> Transition to Respective Role Portal
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setAppStage('portal');
    setToastMessage(`Statutory Auth Verified for ${user.name} (${user.role}).`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sign out strictly required to switch role/profile
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setAppStage('auth');
    setToastMessage('Signed out. Please authenticate with required role credentials.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleActionComplete = async (msg: string) => {
    setToastMessage(msg);
    await fetchDatabaseRecords();
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleResetDatabase = async () => {
    setIsLoadingDb(true);
    await margaDatabase.resetDatabase();
    await fetchDatabaseRecords();
    setToastMessage('Database re-synchronized with Mysuru & Southern Karnataka regional baseline.');
  };

  // Select work by ID (e.g. from search or audit log)
  const handleSelectWorkById = (workId: string) => {
    const found = works.find((w) => w.id === workId);
    if (found) {
      setSelectedWork(found);
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // =========================================================================
  // STEP 1: LANDING PAGE (480-Frame Scrollytelling Sequence & National Mandate)
  // =========================================================================
  if (appStage === 'landing') {
    return (
      <LandingStorySequence
        onSelectRoleForAuth={(role) => {
          setSelectedRoleForAuth(role);
          setCurrentRole(role);
          setAppStage('auth');
        }}
        currentUser={currentUser}
        onProceedToDashboard={() => setAppStage('portal')}
        onLogout={handleLogout}
      />
    );
  }

  // =========================================================================
  // STEP 2: AUTH (RoleLoginPage: Authenticate with selected persona credentials)
  // =========================================================================
  if (appStage === 'auth' || !currentUser) {
    return (
      <RoleLoginPage
        initialRole={selectedRoleForAuth}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // =========================================================================
  // STEP 3: RESPECTIVE DASHBOARDS (Strictly role-based portal, no switching)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Authoritative Header */}
      <Header
        currentRole={currentUser.role}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenMatrix={() => setIsMatrixOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuditLedger={() => setIsAuditLedgerOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenReportGenerator={() => setIsReportOpen(true)}
        onOpenStorySequence={() => setAppStage('landing')}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
      />

      {/* Main Workspace Layout with Compact Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentRole={currentUser.role}
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenStorySequence={() => setAppStage('landing')}
          attentionCount={
            currentUser.role === 'MP' ? 2 : currentUser.role === 'DA' ? 4 : currentUser.role === 'IA' ? 3 : 2
          }
        />

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl">
          {isLoadingDb ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-white border border-slate-200 rounded-lg my-8">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-700 mb-3" />
              <h2 className="text-sm font-bold text-slate-900">Connecting to MARGA Mysuru Regional Database...</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Retrieving active works, statutory sanctions, and audit ledgers for Mysuru, Mandya, Chamarajanagar, Hassan, and Kodagu.
              </p>
            </div>
          ) : (
            <>
              {currentUser.role === 'MP' && (
                <MpPortal
                  currentUser={currentUser}
                  works={works}
                  activeView={activeView}
                  onSelectWork={setSelectedWork}
                  onOpenRiskExplanation={setRiskModalWork}
                  onActionComplete={handleActionComplete}
                  onOpenMatrix={() => setIsMatrixOpen(true)}
                />
              )}

              {currentUser.role === 'DA' && (
                <DaPortal
                  works={works}
                  recommendations={recommendations}
                  activeView={activeView}
                  onSelectWork={setSelectedWork}
                  onOpenRiskExplanation={setRiskModalWork}
                  onActionComplete={handleActionComplete}
                  onOpenMatrix={() => setIsMatrixOpen(true)}
                />
              )}

              {currentUser.role === 'IA' && (
                <IaPortal
                  works={works}
                  activeView={activeView}
                  onSelectWork={setSelectedWork}
                  onOpenRiskExplanation={setRiskModalWork}
                  onActionComplete={handleActionComplete}
                  onOpenMatrix={() => setIsMatrixOpen(true)}
                />
              )}

              {currentUser.role === 'STATE' && (
                <StatePortal
                  districts={districts}
                  works={works}
                  activeView={activeView}
                  onSelectWork={setSelectedWork}
                  onOpenRiskExplanation={setRiskModalWork}
                  onActionComplete={handleActionComplete}
                  onOpenMatrix={() => setIsMatrixOpen(true)}
                />
              )}

              {currentUser.role === 'MOSPI' && (
                <MospiPortal
                  works={works}
                  districts={districts}
                  activeView={activeView}
                  onSelectWork={setSelectedWork}
                  onOpenRiskExplanation={setRiskModalWork}
                  onActionComplete={handleActionComplete}
                  onOpenMatrix={() => setIsMatrixOpen(true)}
                />
              )}

              {/* Sovereign Institutional Production Footer */}
              <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
                  <span className="font-semibold text-slate-800">MARGA Unified Monitoring System</span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span>Ministry of Statistics and Programme Implementation (MoSPI)</span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="font-mono text-[11px] text-slate-500">v2.4.0-PROD</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    NIC National Cloud Operating Securely
                  </span>
                  <span>Security Audit Certified (CERT-In)</span>
                  <button
                    onClick={async () => {
                      setIsLoadingDb(true);
                      await margaDatabase.syncWithCluster();
                      await fetchDatabaseRecords();
                      setToastMessage('Refreshed directly from national central servers.');
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer font-medium"
                    title="Refresh records from central servers"
                  >
                    Refresh Live Records
                  </button>
                </div>
              </footer>
            </>
          )}
        </main>
      </div>

      {/* Global Interactive Role Permission & Guardrail Matrix Modal */}
      <RolePermissionMatrixModal
        currentRole={currentRole}
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        onSwitchRole={handleRoleChange}
      />

      {/* Universal Work Detail & Evidence Drawer */}
      <WorkDetailDrawer
        work={selectedWork}
        currentRole={currentRole}
        role={currentRole}
        isOpen={!!selectedWork}
        onClose={() => setSelectedWork(null)}
        onOpenRiskExplanation={setRiskModalWork}
        onActionComplete={handleActionComplete}
      />

      {/* Explainable AI Risk Model Modal */}
      <RiskExplanationModal
        work={riskModalWork}
        isOpen={!!riskModalWork}
        onClose={() => setRiskModalWork(null)}
      />

      {/* Factual, Quiet AI Assistant Drawer */}
      <AiAssistantDrawer
        currentRole={currentRole}
        role={currentRole}
        selectedWork={selectedWork}
        works={works}
        activeMpName={currentUser?.name}
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onOpenWork={handleSelectWorkById}
        onInspectWork={setSelectedWork}
      />

      {/* Global Search Dialog */}
      <GlobalSearchModal
        works={works}
        districts={districts}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectWork={setSelectedWork}
        onSelectDistrict={(id) => {
          setCurrentRole('STATE');
        }}
      />

      {/* Authoritative Action & Evidence Ledger */}
      <AuditLedgerModal
        logs={actionLogs}
        isOpen={isAuditLedgerOpen}
        onClose={() => setIsAuditLedgerOpen(false)}
        onSelectWork={handleSelectWorkById}
      />

      {/* Official Report Generator */}
      <ReportGeneratorModal
        role={currentRole}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        notifications={notifications}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectWork={handleSelectWorkById}
      />

      {/* Redesigned Floating Ask MARGA AI Button (Left Bottom Corner) */}
      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          id="btn-floating-ask-marga"
          type="button"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-2xl border border-slate-700 transition-all hover:scale-105 cursor-pointer font-sans group"
          title="Ask MARGA AI — Statutory MPLADS Intelligence"
          aria-label="Open Ask MARGA Assistant"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <Sparkles className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-semibold tracking-wide">Ask MARGA AI</span>
        </button>
      </div>

      {/* Action Completed Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-60 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
