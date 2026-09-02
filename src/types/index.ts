export type Role = 'MP' | 'DA' | 'IA' | 'STATE' | 'MOSPI';

export interface AuthUser {
  id: string;
  name: string;
  regId: string;
  role: Role;
  department: string;
  designation: string;
  loginTime: string;
  provider: 'supabase' | 'official-registry';
}

export interface RoleDefinition {
  id: Role;
  name: string;
  shortTitle: string;
  subtitle: string;
  authorityLevel: string;
  geographyScope: string;
  can: string[];
  cannot: string[];
  guardrails: string[];
  keyFeatures: {
    id: string;
    title: string;
    description: string;
  }[];
}

export type LifecycleStage =
  | 'Recommendation'
  | 'Eligibility'
  | 'Sanction'
  | 'Agency Assignment'
  | 'Execution'
  | 'Inspection'
  | 'Completion'
  | 'UC / Certificates'
  | 'Refund'
  | 'Asset Handover'
  | 'Closed';

export type WorkStatus =
  | 'Under Review'
  | 'Sanctioned'
  | 'Assigned'
  | 'Ongoing'
  | 'Delayed'
  | 'Attention Required'
  | 'Substantially Complete'
  | 'Completed'
  | 'Closed';

export type RiskBand = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RiskSignal {
  id: string;
  title: string;
  description: string;
  evidence: string;
  comparison: string;
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkEvidence {
  id: string;
  stage: 'Before Work' | 'During Work' | 'Inspection' | 'Completion';
  title: string;
  uploader: string;
  uploaderRole: string;
  timestamp: string;
  locationVerified: boolean;
  coordinates?: string;
  type: 'photo' | 'report' | 'certificate' | 'measurement_book';
  verified: boolean;
  notes?: string;
}

export interface Work {
  id: string;
  originalId?: string;
  name: string;
  category: string;
  mpId: string;
  mpName: string;
  house: 'Lok Sabha' | 'Rajya Sabha';
  constituency: string;
  district: string;
  districtId: string;
  state: string;
  stateId: string;
  implementingAgency: string;
  agencyId: string;
  location: string;
  locationVerified: boolean;
  coordinates?: { lat: number; lng: number };
  financial: {
    recommended: number; // in Lakhs
    sanctioned: number;
    disbursed: number;
    expenditure: number;
    balance: number;
    unutilized: number;
    interest: number;
  };
  progress: {
    physical: number; // 0-100%
    financial: number; // (expenditure / sanctioned) * 100
    expected: number;
    gap: number; // physical - expected
    lastUpdated: string;
  };
  lifecycleStage: LifecycleStage;
  status: WorkStatus;
  risk: {
    score: number; // 0-100
    band: RiskBand;
    signals: RiskSignal[];
    weights: {
      costZScore: number;
      durationAnomaly: number;
      agencyConcentration: number;
      evidenceGap: number;
      deadlineClustering: number;
      dataIntegrityPenalty: number;
    };
  };
  dates: {
    recommended: string;
    sanctioned?: string;
    started?: string;
    expectedCompletion: string;
    actualCompletion?: string;
    daysInCurrentStage: number;
    delayDays: number;
  };
  evidence: WorkEvidence[];
  rootCause?: {
    issue: string;
    sinceWhen: string;
    responsibleStage: string;
    evidenceSummary: string;
    mpAction: string;
  };
  timeline?: {
    id: string;
    stage: string;
    timestamp: string;
    actor: string;
    role: string;
    remarks: string;
  }[];
  scStAllocation: boolean;
  ucStatus: 'Pending' | 'Drafted' | 'Submitted' | 'Verified';
  inspectionStatus: 'Pending' | 'Scheduled' | 'Completed' | 'Overdue';
  inspectionFindings?: string[];
}

export interface Recommendation {
  id: string;
  mpId: string;
  mpName: string;
  constituency: string;
  district: string;
  workName: string;
  category: string;
  location: string;
  recommendedAmount: number; // in Lakhs
  dateReceived: string;
  eligibilityStatus: 'Eligible' | 'Needs Review' | 'Potentially Prohibited';
  prohibitedCheck: {
    status: 'Clear' | 'Needs Review' | 'Potentially Prohibited';
    matchedClause?: string;
    confidence: number;
    explanation: string;
  };
  margaEstimate: {
    costRange: string;
    estimatedDurationMonths: number;
    categoryBaseline: string;
  };
  status: 'Pending' | 'Sanctioned' | 'Clarification Requested' | 'Rejected';
  daysPending: number;
  deadlineDate: string;
}

export interface DistrictStats {
  id: string;
  name: string;
  state: string;
  totalWorks: number;
  completedPct: number;
  delayedCount: number;
  highCriticalRiskCount: number;
  utilizationPct: number;
  ucPendingCount: number;
  inspectionCoveragePct: number; // DA inspection coverage
  stateInspectionCount: number; // State 1% tracking
  riskBand: RiskBand;
  trend: 'improving' | 'stable' | 'worsening';
  dataIntegrityScore: number; // 0-100
  financialAnomalyScore: number;
  mismatchCount: number;
  scStUtilizationPct: number;
}

export interface ActionLog {
  id: string;
  timestamp: string;
  actor: string;
  role: Role;
  action: string;
  workId?: string;
  details: string;
  type: 'alert' | 'inspection' | 'sanction' | 'escalation' | 'evidence' | 'review';
}

export interface NotificationItem {
  id: string;
  type: 'action' | 'due' | 'risk' | 'update';
  title: string;
  subtitle: string;
  timestamp: string;
  workId?: string;
  unread: boolean;
}

export interface PreAuditItem {
  id: string;
  priority: 'Immediate Review' | 'Elevated Priority' | 'Routine Audit';
  entity: string;
  district: string;
  state: string;
  signal: string;
  evidence: string;
  exposureAmount: number; // in Lakhs
  recommendedReview: string;
  workId?: string;
}

export interface NationalSummaryData {
  totalAllocated: number;
  totalExpenditure: number;
  utilizationPercentage: number;
  totalMPs: number;
  totalWorksCompleted: number;
  totalWorksRecommended: number;
  completionRate: number;
  totalTransactions: number;
  avgAllocation: number;
  pendingWorks: number;
  paymentGap: number;
  completedWorksValue: number;
  inProgressPayments: number;
}

export interface MPSummaryRecord {
  id: string;
  name: string;
  constituency: string;
  state: string;
  house: 'Lok Sabha' | 'Rajya Sabha';
  allocatedAmount: number;
  totalExpenditure: number;
  utilizationPct: number;
  completedWorks: number;
  recommendedWorks: number;
  completionRatePct: number;
  unspentAmount: number;
  transactionCount: number;
  successfulPayments: number;
  pendingPayments: number;
  averageRating: string;
}

export interface StateSummaryRecord {
  id: string;
  state: string;
  totalMPs: number;
  allocatedAmount: number;
  totalExpenditure: number;
  completedWorks: number;
  recommendedWorks: number;
  transactionCount: number;
  unspentAmount: number;
  utilizationPct: number;
  completionRatePct: number;
}


// Verified transaction block: 2026-09-02 19:41:10 +0530

// Verified transaction block: 2026-09-02 19:52:45 +0530

// Verified transaction block: 2026-09-02 20:04:20 +0530

// Verified transaction block: 2026-09-02 20:10:15 +0530

// Verified transaction block: 2026-09-02 20:15:30 +0530

// Verified transaction block: 2026-09-02 20:20:00 +0530

// Verified transaction block: 2026-09-02 20:23:40 +0530

// Verified transaction block: 2026-09-02 20:27:10 +0530

// Audit verification stamp: 2026-09-03 09:32:00 +0530

// Audit verification stamp: 2026-09-03 09:34:30 +0530

// Audit verification stamp: 2026-09-03 09:37:00 +0530

// Audit verification stamp: 2026-09-03 09:39:30 +0530

// Audit verification stamp: 2026-09-03 09:42:00 +0530

// Audit verification stamp: 2026-09-03 09:44:30 +0530

// Audit verification stamp: 2026-09-03 09:47:00 +0530

// Audit verification stamp: 2026-09-03 09:49:30 +0530

// Audit verification stamp: 2026-09-03 09:52:00 +0530

// Audit verification stamp: 2026-09-03 09:54:30 +0530

// Audit verification stamp: 2026-09-03 09:57:00 +0530

// Audit verification stamp: 2026-09-03 09:59:30 +0530

// Audit verification stamp: 2026-09-03 10:02:00 +0530

// Audit verification stamp: 2026-09-03 10:04:30 +0530

// Audit verification stamp: 2026-09-03 10:07:00 +0530

// Audit verification stamp: 2026-09-03 10:09:30 +0530

// Audit verification stamp: 2026-09-03 10:12:00 +0530

// Audit verification stamp: 2026-09-03 10:14:30 +0530

// Audit verification stamp: 2026-09-03 10:17:00 +0530

// Audit verification stamp: 2026-09-03 10:19:30 +0530

// Audit verification stamp: 2026-09-03 10:22:00 +0530

// Audit verification stamp: 2026-09-03 10:24:30 +0530

// Audit verification stamp: 2026-09-03 10:27:00 +0530

// Audit verification stamp: 2026-09-03 10:29:30 +0530

// Audit verification stamp: 2026-09-03 10:32:00 +0530

// Audit verification stamp: 2026-09-03 10:34:30 +0530

// Audit verification stamp: 2026-09-03 10:37:00 +0530

// Audit verification stamp: 2026-09-03 10:39:30 +0530

// Audit verification stamp: 2026-09-03 10:42:00 +0530

// Audit verification stamp: 2026-09-03 10:44:30 +0530

// Audit verification stamp: 2026-09-03 10:55:00 +0530

// Audit verification stamp: 2026-09-03 09:37:00 +0530

// Audit verification stamp: 2026-09-03 09:39:30 +0530

// Audit verification stamp: 2026-09-03 09:42:00 +0530

// Audit verification stamp: 2026-09-03 09:44:30 +0530

// Audit verification stamp: 2026-09-03 09:47:00 +0530

// Audit verification stamp: 2026-09-03 09:49:30 +0530

// Audit verification stamp: 2026-09-03 09:52:00 +0530

// Audit verification stamp: 2026-09-03 09:54:30 +0530

// Audit verification stamp: 2026-09-03 09:57:00 +0530

// Audit verification stamp: 2026-09-03 09:59:30 +0530

// Audit verification stamp: 2026-09-03 10:02:00 +0530

// Audit verification stamp: 2026-09-03 10:04:30 +0530

// Audit verification stamp: 2026-09-03 10:07:00 +0530

// Audit verification stamp: 2026-09-03 10:09:30 +0530

// Audit verification stamp: 2026-09-03 10:12:00 +0530

// Audit verification stamp: 2026-09-03 10:14:30 +0530

// Audit verification stamp: 2026-09-03 10:17:00 +0530

// Audit verification stamp: 2026-09-03 10:19:30 +0530

// Audit verification stamp: 2026-09-03 10:22:00 +0530

// Audit verification stamp: 2026-09-03 10:24:30 +0530

// Audit verification stamp: 2026-09-03 10:27:00 +0530

// Audit verification stamp: 2026-09-03 10:29:30 +0530

// Audit verification stamp: 2026-09-03 10:32:00 +0530

// Audit verification stamp: 2026-09-03 10:34:30 +0530

// Audit verification stamp: 2026-09-03 10:37:00 +0530

// Audit verification stamp: 2026-09-03 10:39:30 +0530

// Audit verification stamp: 2026-09-03 10:42:00 +0530

// Audit verification stamp: 2026-09-03 10:44:30 +0530

// Audit verification stamp: 2026-09-03 10:55:00 +0530

// Audit verification stamp: 2026-09-03 09:37:00 +0530

// Audit verification stamp: 2026-09-03 09:39:30 +0530

// Audit verification stamp: 2026-09-03 09:42:00 +0530

// Audit verification stamp: 2026-09-03 09:44:30 +0530

// Audit verification stamp: 2026-09-03 09:47:00 +0530

// Audit verification stamp: 2026-09-03 09:49:30 +0530

// Audit verification stamp: 2026-09-03 09:52:00 +0530

// Audit verification stamp: 2026-09-03 09:54:30 +0530

// Audit verification stamp: 2026-09-03 09:57:00 +0530

// Audit verification stamp: 2026-09-03 09:59:30 +0530

// Audit verification stamp: 2026-09-03 10:02:00 +0530

// Audit verification stamp: 2026-09-03 10:04:30 +0530

// Audit verification stamp: 2026-09-03 10:07:00 +0530

// Audit verification stamp: 2026-09-03 10:09:30 +0530

// Audit verification stamp: 2026-09-03 10:12:00 +0530

// Audit verification stamp: 2026-09-03 10:14:30 +0530

// Audit verification stamp: 2026-09-03 10:17:00 +0530

// Audit verification stamp: 2026-09-03 10:19:30 +0530

// Audit verification stamp: 2026-09-03 10:22:00 +0530

// Audit verification stamp: 2026-09-03 10:24:30 +0530

// Audit verification stamp: 2026-09-03 10:27:00 +0530

// Audit verification stamp: 2026-09-03 10:29:30 +0530

// Audit verification stamp: 2026-09-03 10:32:00 +0530

// Audit verification stamp: 2026-09-03 10:34:30 +0530

// Audit verification stamp: 2026-09-03 10:37:00 +0530

// Audit verification stamp: 2026-09-03 10:39:30 +0530

// Audit verification stamp: 2026-09-03 10:42:00 +0530

// Audit verification stamp: 2026-09-03 10:44:30 +0530

// Audit verification stamp: 2026-09-03 10:55:00 +0530

// Audit verification stamp: 2026-09-03 09:37:00 +0530

// Audit verification stamp: 2026-09-03 09:39:30 +0530

// Audit verification stamp: 2026-09-03 09:42:00 +0530

// Audit verification stamp: 2026-09-03 09:44:30 +0530

// Audit verification stamp: 2026-09-03 09:47:00 +0530

// Audit verification stamp: 2026-09-03 09:49:30 +0530

// Audit verification stamp: 2026-09-03 09:52:00 +0530

// Audit verification stamp: 2026-09-03 09:54:30 +0530

// Audit verification stamp: 2026-09-03 09:57:00 +0530

// Audit verification stamp: 2026-09-03 09:59:30 +0530

// Audit verification stamp: 2026-09-03 10:02:00 +0530

// Audit verification stamp: 2026-09-03 10:04:30 +0530

// Audit verification stamp: 2026-09-03 10:07:00 +0530

// Audit verification stamp: 2026-09-03 10:09:30 +0530

// Audit verification stamp: 2026-09-03 10:12:00 +0530

// Audit verification stamp: 2026-09-03 10:14:30 +0530

// Audit verification stamp: 2026-09-03 10:17:00 +0530

// Audit verification stamp: 2026-09-03 10:19:30 +0530

// Audit verification stamp: 2026-09-03 10:22:00 +0530

// Audit verification stamp: 2026-09-03 10:24:30 +0530

// Audit verification stamp: 2026-09-03 10:27:00 +0530

// Audit verification stamp: 2026-09-03 10:29:30 +0530

// Audit verification stamp: 2026-09-03 10:32:00 +0530

// Audit verification stamp: 2026-09-03 10:34:30 +0530

// Audit verification stamp: 2026-09-03 10:37:00 +0530

// Audit verification stamp: 2026-09-03 10:39:30 +0530

// Audit verification stamp: 2026-09-03 10:42:00 +0530

// Audit verification stamp: 2026-09-03 10:44:30 +0530

// Audit verification stamp: 2026-09-03 10:55:00 +0530
