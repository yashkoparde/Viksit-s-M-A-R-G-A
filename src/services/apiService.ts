/**
 * MARGA API Client Service
 * Connects frontend directly to Express backend & MongoDB Atlas (mplads_db on Cluster0).
 */

export interface DbStatusResponse {
  status: 'connected' | 'offline';
  connected: boolean;
  cluster: string;
  host: string;
  database: string;
  counts: {
    works: number;
    mps: number;
    da_reviews: number;
    ia_inspections: number;
    geotagged_photos: number;
    reports: number;
    expenditures: number;
  };
  timestamp: string;
}

export interface ApiWorkRecord {
  _id?: string;
  workId: string;
  rawId?: string;
  sourceWorkId?: string;
  description: string;
  category: string;
  mpName: string;
  constituency: string;
  state: string;
  district: string;
  house: string;
  recommendedAmount: number;
  sanctionedAmount: number;
  disbursedAmount: number;
  finalAmount?: number;
  status: string;
  physicalProgress: number;
  sanctionDate?: string;
  actualCompletionDate?: string;
  ida?: string;
  hasImages?: boolean;
  department?: string;
}

class ApiService {
  private baseUrl = '';

  // 1. Database & Cluster Status
  async getDbStatus(): Promise<DbStatusResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/db-status`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('[API] Could not fetch db-status:', e);
      return null;
    }
  }

  // 2. Fetch Works with filters
  async getWorks(params: {
    state?: string;
    status?: string;
    category?: string;
    constituency?: string;
    mpName?: string;
    district?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest';
  } = {}): Promise<{ total: number; data: ApiWorkRecord[] } | null> {
    try {
      const query = new URLSearchParams();
      if (params.state) query.set('state', params.state);
      if (params.status && params.status !== 'all') query.set('status', params.status);
      if (params.category && params.category !== 'all') query.set('category', params.category);
      if (params.constituency) query.set('constituency', params.constituency);
      if (params.mpName) query.set('mpName', params.mpName);
      if (params.district) query.set('district', params.district);
      if (params.search) query.set('search', params.search);
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.sort) query.set('sort', params.sort);

      const res = await fetch(`${this.baseUrl}/api/works?${query.toString()}`);
      if (!res.ok) return null;
      const json = await res.json();
      return { total: json.total || 0, data: json.data || [] };
    } catch (e) {
      console.warn('[API] getWorks error:', e);
      return null;
    }
  }

  // 3. Fetch Single Work with audits, inspections & photos
  async getWorkById(workId: string): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/works/${encodeURIComponent(workId)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.warn('[API] getWorkById error:', e);
      return null;
    }
  }

  // 4. Create New Work Order / Recommendation (MP -> MongoDB Atlas)
  async createWork(workData: Record<string, any>): Promise<ApiWorkRecord | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workData),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error('[API] createWork error:', e);
      return null;
    }
  }

  // 5. Update Work in MongoDB Atlas
  async updateWork(workId: string, updates: Record<string, any>): Promise<ApiWorkRecord | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/works/${encodeURIComponent(workId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error('[API] updateWork error:', e);
      return null;
    }
  }

  // 6. District Authority Review (Approval / Rejection -> MongoDB Atlas)
  async submitDAReview(reviewData: {
    workId: string;
    feasible: boolean;
    estimatedTimeMonths: number;
    prohibited: boolean;
    remarks: string;
    reviewedBy: string;
    sanctionedAmount?: number;
  }): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/da-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error('[API] submitDAReview error:', e);
      return null;
    }
  }

  // 7. Implementing Agency Inspection (Progress Update -> MongoDB Atlas)
  async submitInspection(inspectionData: {
    workId: string;
    iaId: string;
    progressPercentage: number;
    remarks: string;
    reportingPeriod?: string;
  }): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectionData),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      return json;
    } catch (e) {
      console.error('[API] submitInspection error:', e);
      return null;
    }
  }

  // 8. Upload Geotagged Evidence Photo
  async uploadPhoto(formData: FormData): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/photos/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.error('[API] uploadPhoto error:', e);
      return null;
    }
  }

  // 9. Fetch MPs
  async getMPs(params: { search?: string; house?: string; state?: string; limit?: number } = {}): Promise<any[] | null> {
    try {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.house) query.set('house', params.house);
      if (params.state) query.set('state', params.state);
      if (params.limit) query.set('limit', String(params.limit));

      const res = await fetch(`${this.baseUrl}/api/mps?${query.toString()}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('[API] getMPs error:', e);
      return null;
    }
  }

  // 10. Fetch National Overview Analytics
  async getAnalyticsOverview(): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/analytics/overview`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (e) {
      console.warn('[API] getAnalyticsOverview error:', e);
      return null;
    }
  }
}

export const apiService = new ApiService();
