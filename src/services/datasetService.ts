import {
  NationalSummaryData,
  MPSummaryRecord,
  StateSummaryRecord,
  Work,
  Role,
} from '../types';
import {
  NATIONAL_SUMMARY_DATA,
  MP_SUMMARY_DATA,
  STATE_SUMMARY_DATA,
  INITIAL_REAL_WORKS,
} from '../data/datasetData';

class DatasetService {
  private nationalSummary: NationalSummaryData = NATIONAL_SUMMARY_DATA;
  private mpSummaries: MPSummaryRecord[] = MP_SUMMARY_DATA;
  private stateSummaries: StateSummaryRecord[] = STATE_SUMMARY_DATA;
  private works: Work[] = INITIAL_REAL_WORKS;
  private isFullDatasetLoaded = false;

  constructor() {
    this.initAsync();
  }

  private async initAsync() {
    // Attempt to load full works dataset from public/data/works.json if available
    try {
      if (typeof window !== 'undefined' && window.fetch) {
        const res = await fetch('/data/works.json');
        if (res.ok) {
          const fullWorks: Work[] = await res.json();
          if (Array.isArray(fullWorks) && fullWorks.length > 0) {
            this.works = fullWorks;
            this.isFullDatasetLoaded = true;
          }
        }
      }
    } catch (e) {
      console.info('Using pre-bundled initial works dataset', e);
    }
  }

  // --- NATIONAL LEVEL (MOSPI) ---
  public getNationalSummary(): NationalSummaryData {
    return this.nationalSummary;
  }

  // --- STATE LEVEL (STATE) ---
  public getAllStates(): StateSummaryRecord[] {
    return [...this.stateSummaries];
  }

  public getStateByName(stateName: string): StateSummaryRecord | undefined {
    const clean = stateName.trim().toLowerCase();
    return this.stateSummaries.find(
      (s) => s.state.trim().toLowerCase() === clean
    );
  }

  public getMPsByState(stateName: string): MPSummaryRecord[] {
    const clean = stateName.trim().toLowerCase();
    return this.mpSummaries.filter(
      (m) => m.state.trim().toLowerCase() === clean
    );
  }

  // --- MP LEVEL (MP) ---
  public getAllMPs(): MPSummaryRecord[] {
    return [...this.mpSummaries];
  }

  public getMPByName(mpName: string): MPSummaryRecord | undefined {
    const clean = mpName.trim().toLowerCase();
    return this.mpSummaries.find(
      (m) =>
        m.name.trim().toLowerCase() === clean ||
        m.name.trim().toLowerCase().includes(clean) ||
        clean.includes(m.name.trim().toLowerCase())
    );
  }

  public getMPByConstituency(constituency: string): MPSummaryRecord | undefined {
    const clean = constituency.trim().toLowerCase();
    return this.mpSummaries.find(
      (m) => m.constituency.trim().toLowerCase() === clean
    );
  }

  // --- WORKS LEDGER (ALL ROLES) ---
  public getAllWorks(): Work[] {
    return [...this.works];
  }

  public getWorksForMP(mpNameOrConstituency: string): Work[] {
    const clean = mpNameOrConstituency.trim().toLowerCase();
    const filtered = this.works.filter(
      (w) =>
        w.mpName.toLowerCase().includes(clean) ||
        w.constituency.toLowerCase() === clean ||
        clean.includes(w.mpName.toLowerCase()) ||
        clean.includes(w.constituency.toLowerCase())
    );
    return filtered.length > 0 ? filtered : this.works.slice(0, 50);
  }

  public getWorksForDistrict(districtName: string): Work[] {
    const clean = districtName.trim().toLowerCase();
    const filtered = this.works.filter(
      (w) =>
        w.district.toLowerCase().includes(clean) ||
        w.implementingAgency.toLowerCase().includes(clean)
    );
    return filtered.length > 0 ? filtered : this.works.slice(0, 50);
  }

  public getWorksForState(stateName: string): Work[] {
    const clean = stateName.trim().toLowerCase();
    return this.works.filter((w) => w.state.toLowerCase() === clean);
  }

  public getWorksForAgency(agencyNameOrId: string): Work[] {
    const clean = agencyNameOrId.trim().toLowerCase();
    return this.works.filter(
      (w) =>
        w.implementingAgency.toLowerCase().includes(clean) ||
        w.agencyId.toLowerCase() === clean
    );
  }

  // --- ROLE-SPECIFIC CONTEXT GENERATOR ---
  public getRoleDatasetContext(role: Role, identifier?: string) {
    switch (role) {
      case 'MOSPI': {
        return {
          national: this.getNationalSummary(),
          topPerformingStates: [...this.stateSummaries]
            .sort((a, b) => b.utilizationPct - a.utilizationPct)
            .slice(0, 5),
          laggingStates: [...this.stateSummaries]
            .sort((a, b) => a.utilizationPct - b.utilizationPct)
            .slice(0, 5),
          allStates: this.stateSummaries,
        };
      }
      case 'STATE': {
        const stateName = identifier || 'Karnataka';
        const stateStats = this.getStateByName(stateName) || this.stateSummaries[0];
        const stateMPs = this.getMPsByState(stateStats.state);
        return {
          state: stateStats,
          mps: stateMPs,
          totalMPs: stateMPs.length,
          works: this.getWorksForState(stateStats.state),
        };
      }
      case 'MP': {
        const mpName = identifier || 'YADUVEER KRISHNADATTA CHAMARAJA WADIYAR';
        const mpRecord =
          this.getMPByName(mpName) ||
          this.getMPByConstituency('MYSORE') ||
          this.mpSummaries[0];
        const mpWorks = this.getWorksForMP(mpRecord.name);
        return {
          mp: mpRecord,
          works: mpWorks,
        };
      }
      case 'DA': {
        const district = identifier || 'Mysuru';
        const districtWorks = this.getWorksForDistrict(district);
        return {
          district,
          works: districtWorks,
        };
      }
      case 'IA': {
        const agency = identifier || 'MUDA';
        const agencyWorks = this.getWorksForAgency(agency);
        return {
          agency,
          works: agencyWorks.length > 0 ? agencyWorks : this.works.slice(0, 30),
        };
      }
    }
  }
}

export const datasetService = new DatasetService();
