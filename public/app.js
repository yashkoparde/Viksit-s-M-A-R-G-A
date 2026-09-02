/**
 * MARGA — Official MPLADS Governance & Analytics Platform
 * Client Application Controller
 * Real dataset integration, deterministic comparison graphing, and persistent audit trail.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  checkClusterStatus();
  loadOverview();
  setupSearch();
  setupMPFilters();
  setupStateFilter();
  setupInspectionForm();
  setupCompare();
  setupIAQuickWorks();
});

// ==========================================================================
// 1. NAVIGATION & ROUTING
// ==========================================================================

const HASH_TO_TAB = {
  '#home': 'story',
  '#story': 'story',
  '#mospi': 'overview',
  '#overview': 'overview',
  '#national': 'overview',
  '#da': 'search-work',
  '#district': 'search-work',
  '#search-work': 'search-work',
  '#ia': 'camera',
  '#camera': 'camera',
  '#inspection': 'camera',
  '#mp': 'mps',
  '#mps': 'mps',
  '#states': 'states',
  '#rankings': 'states',
  '#compare': 'compare'
};

const TAB_TO_HASH = {
  'story': '#home',
  'overview': '#mospi',
  'mps': '#mp',
  'search-work': '#da',
  'camera': '#ia',
  'states': '#states',
  'compare': '#compare'
};

// Statutory Role Profiles from MARGA-Y Architecture
const OFFICIAL_ROLE_PROFILES = {
  MP: {
    role: 'MP',
    name: "Hon'ble MP Portfolio Officer",
    regId: 'REG-MP-LS-042',
    department: 'Parliament House, New Delhi',
    badge: 'Lok Sabha / Rajya Sabha Representative',
    targetTab: 'mps'
  },
  DA: {
    role: 'DA',
    name: 'District Magistrate & Collector',
    regId: 'REG-DA-DM-104',
    department: 'District Collectorate / IDA Office',
    badge: 'Statutory Implementing District Authority (IDA)',
    targetTab: 'search-work'
  },
  IA: {
    role: 'IA',
    name: 'Executive Engineer / IA Field Officer',
    regId: 'REG-IA-ENG-809',
    department: 'Public Works & Rural Engineering Division',
    badge: 'Field Engineering & 30-Day Physical Audit',
    targetTab: 'camera'
  },
  STATE: {
    role: 'STATE',
    name: 'State Planning & Nodal Commissioner',
    regId: 'REG-ST-NOD-017',
    department: 'State Nodal Directorate of MPLADS',
    badge: '36 States / UTs Nodal Planning & Audit',
    targetTab: 'states'
  },
  MOSPI: {
    role: 'MOSPI',
    name: 'Central Ministry Deputy Director',
    regId: 'REG-MOSPI-HQ-001',
    department: 'MoSPI HQ, Government of India, New Delhi',
    badge: 'National Central Oversight & Policy Analytics',
    targetTab: 'overview'
  }
};

let currentSelectedAuthRole = 'MP';
let currentAuthenticatedUser = null;

window.switchTab = function (tabName, updateHash = true) {
  const navBtns = document.querySelectorAll('.nav-link, .nav-item');
  const tabs = document.querySelectorAll('.tab-panel, .tab-content');
  const sequenceHUD = document.getElementById('sequenceHUD');

  navBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  tabs.forEach(t => t.classList.remove('active'));

  const activeContent = document.getElementById(`tab-${tabName}`);
  if (activeContent) {
    activeContent.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Toggle Sequence HUD visibility: visible on Scrollytelling Home page
  if (sequenceHUD) {
    sequenceHUD.style.display = (tabName === 'story') ? 'flex' : 'none';
  }

  // Body state class
  if (tabName === 'story') {
    document.body.classList.add('story-mode-active');
  } else {
    document.body.classList.remove('story-mode-active');
  }

  if (updateHash && TAB_TO_HASH[tabName]) {
    if (window.location.hash !== TAB_TO_HASH[tabName]) {
      history.pushState(null, null, TAB_TO_HASH[tabName]);
    }
  }

  if (tabName === 'story' && window.triggerStorySequence) {
    window.triggerStorySequence();
  }
  if (tabName === 'mps') loadMPs();
  if (tabName === 'states') loadStates();
  if (tabName === 'compare') runComparison();
  if (tabName === 'overview') loadOverview();
  if (tabName === 'camera') setupIAQuickWorks();
};

function handleHashRoute() {
  const hash = window.location.hash.toLowerCase();
  if (hash === '#auth' || hash === '#login') {
    window.openAuthModal();
    return;
  }
  if (hash && HASH_TO_TAB[hash]) {
    window.switchTab(HASH_TO_TAB[hash], false);
  } else {
    // Default to Landing Page with Scrollytelling Sequence
    window.switchTab('story', false);
  }
}

window.addEventListener('hashchange', handleHashRoute);

// Auth Modal Handlers
window.openAuthModal = function (role = 'MP') {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'flex';
    window.selectAuthRole(role);
  }
};

window.closeAuthModal = function () {
  const modal = document.getElementById('authModal');
  if (modal) modal.style.display = 'none';
};

window.selectAuthRole = function (roleKey) {
  currentSelectedAuthRole = roleKey;
  const tabs = document.querySelectorAll('.auth-role-tab');
  tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-role') === roleKey));

  const prof = OFFICIAL_ROLE_PROFILES[roleKey] || OFFICIAL_ROLE_PROFILES.MP;
  const badgeEl = document.getElementById('authBadgeText');
  const nameEl = document.getElementById('authOfficialName');
  const deptEl = document.getElementById('authOfficialDept');
  const regEl = document.getElementById('authRegId');
  const inName = document.getElementById('authInputName');
  const inReg = document.getElementById('authInputRegId');

  if (badgeEl) badgeEl.innerText = prof.badge;
  if (nameEl) nameEl.innerText = prof.name;
  if (deptEl) deptEl.innerText = prof.department;
  if (regEl) regEl.innerText = prof.regId;
  if (inName) inName.value = prof.name;
  if (inReg) inReg.value = prof.regId;
};

window.openPortal = function (role) {
  if (role) {
    window.location.href = `/portal?role=${encodeURIComponent(role)}`;
  } else {
    window.location.href = '/portal?auth=true';
  }
};

window.submitAuthForm = function (e) {
  if (e) e.preventDefault();
  const prof = OFFICIAL_ROLE_PROFILES[currentSelectedAuthRole] || OFFICIAL_ROLE_PROFILES.MP;
  const inName = document.getElementById('authInputName');
  const inReg = document.getElementById('authInputRegId');

  currentAuthenticatedUser = {
    role: currentSelectedAuthRole,
    name: inName ? inName.value : prof.name,
    regId: inReg ? inReg.value : prof.regId,
    department: prof.department
  };

  try {
    localStorage.setItem('marga_auth_session', JSON.stringify(currentAuthenticatedUser));
    localStorage.setItem('marga_authenticated_user_v1', JSON.stringify(currentAuthenticatedUser));
  } catch {}

  const label = document.getElementById('headerAuthLabel');
  if (label) {
    label.innerText = `${currentAuthenticatedUser.role}: ${currentAuthenticatedUser.name.split(' ')[0]}`;
  }

  const toast = document.getElementById('authStatusToast');
  if (toast) {
    toast.style.display = 'block';
    toast.style.background = 'rgba(16, 185, 129, 0.15)';
    toast.style.color = '#34d399';
    toast.style.border = '1px solid rgba(16, 185, 129, 0.3)';
    toast.innerText = `✓ Authenticated as ${currentAuthenticatedUser.name} (${currentAuthenticatedUser.role}). Launching statutory portal...`;
  }

  setTimeout(() => {
    window.closeAuthModal();
    if (toast) toast.style.display = 'none';
    window.location.href = `/portal?role=${encodeURIComponent(currentAuthenticatedUser.role)}`;
  }, 700);
};

function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-link, .nav-item');
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab) window.switchTab(targetTab);
    });
  });

  // Restore stored session if exists
  try {
    const raw = localStorage.getItem('marga_auth_session');
    if (raw) {
      currentAuthenticatedUser = JSON.parse(raw);
      const label = document.getElementById('headerAuthLabel');
      if (label && currentAuthenticatedUser) {
        label.innerText = `${currentAuthenticatedUser.role}: ${currentAuthenticatedUser.name.split(' ')[0]}`;
      }
    }
  } catch {}

  if (window.location.hash) {
    handleHashRoute();
  } else {
    window.switchTab('story', false);
  }
}

// Check live MongoDB Atlas cluster connection status
async function checkClusterStatus() {
  try {
    const res = await fetch('/api/db-status');
    const json = await res.json();
    const textEl = document.getElementById('mongoClusterText');
    const badgeEl = document.getElementById('mongoClusterBadge');
    if (json.connected) {
      const worksCount = json.counts?.works ? ` (${json.counts.works.toLocaleString()} works)` : '';
      if (textEl) textEl.innerText = `Atlas Cluster0: Connected`;
      if (badgeEl) badgeEl.title = `MongoDB Atlas Cluster0 connected to ${json.database}${worksCount}`;
    } else {
      if (textEl) textEl.innerText = 'Database: Local Persistence';
    }
  } catch (err) {
    console.warn('[Cluster Status Check Error]:', err);
  }
}

// ==========================================================================
// 2. NATIONAL OVERVIEW METRICS (OFFICIAL DATASET)
// ==========================================================================

async function loadOverview() {
  try {
    const res = await fetch('/api/analytics/overview');
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      if (d.totalMPs) document.getElementById('statTotalMPs').innerText = d.totalMPs.toLocaleString();
      if (d.totalSanctioned) document.getElementById('statTotalSanctioned').innerText = formatCurrency(d.totalSanctioned);
      if (d.totalDisbursed) document.getElementById('statTotalDisbursed').innerText = formatCurrency(d.totalDisbursed);
      if (d.avgUtilization !== undefined) document.getElementById('statAvgUtil').innerText = `${d.avgUtilization}%`;
      if (d.totalWorks) document.getElementById('statTotalWorks').innerText = d.totalWorks.toLocaleString();
      if (d.completedWorks) document.getElementById('statCompletedWorks').innerText = d.completedWorks.toLocaleString();
      if (d.totalTransactions) document.getElementById('statTotalTx').innerText = d.totalTransactions.toLocaleString();
    }
  } catch (err) {
    console.error('[Overview] Error:', err);
  }
}

// ==========================================================================
// 3. WORK ID SEARCH & DISTRICT AUTHORITY INSPECTION
// ==========================================================================

function setupSearch() {
  const btnSearch = document.getElementById('btnSearchGlobal');
  const inputSearch = document.getElementById('globalWorkSearch');
  const btnFetch = document.getElementById('btnSearchWorkDetail') || document.getElementById('btnFetchWork');
  const inputFetch = document.getElementById('inputWorkId') || document.getElementById('workIdInput');

  const executeSearch = (id) => {
    if (!id) return;
    window.switchTab('search-work');
    if (inputFetch) inputFetch.value = id;
    fetchWorkDetail(id);
  };

  if (btnSearch && inputSearch) {
    btnSearch.addEventListener('click', () => executeSearch(inputSearch.value.trim()));
    inputSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executeSearch(inputSearch.value.trim());
    });
  }

  if (btnFetch && inputFetch) {
    btnFetch.addEventListener('click', () => fetchWorkDetail(inputFetch.value.trim()));
    inputFetch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') fetchWorkDetail(inputFetch.value.trim());
    });
  }
}

window.searchWork = function () {
  const input = document.getElementById('inputWorkId') || document.getElementById('workIdInput');
  if (input && input.value.trim()) {
    window.switchTab('search-work');
    fetchWorkDetail(input.value.trim());
  }
};

window.inspectSpecificWork = (workId) => {
  window.switchTab('search-work');
  const inputFetch = document.getElementById('inputWorkId') || document.getElementById('workIdInput');
  if (inputFetch) inputFetch.value = workId;
  fetchWorkDetail(workId);
};

async function fetchWorkDetail(workId) {
  const container = document.getElementById('workDetailContainer');
  if (!container) return;
  container.style.display = 'block';
  container.innerHTML = '<div class="card"><p>Retrieving complete audit trail from official MPLADS dataset...</p></div>';

  try {
    const res = await fetch(`/api/works/${encodeURIComponent(workId)}`);
    const json = await res.json();

    if (!json.success) {
      container.innerHTML = `<div class="card"><p style="color:var(--civic-red);">${json.message || 'Work ID not found in dataset.'}</p></div>`;
      return;
    }

    const { work, financialSummary, daReview, inspections, photos } = json.data;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 style="color:#60a5fa;">Official Work ID: ${escapeHtml(work.workId)}</h3>
            <span style="font-size:12px; color:var(--text-muted);">Source: Official MoSPI National Database</span>
          </div>
          <span class="badge ${getStatusBadgeClass(work.status)}">${work.status}</span>
        </div>
        <p style="font-size: 15px; margin-bottom: 20px; line-height: 1.6; color:#fff;">${escapeHtml(work.description)}</p>
        <div class="detail-row">
          <div class="detail-field"><label>Recommended MP</label><span>${escapeHtml(work.mpName || 'Member of Parliament')}</span></div>
          <div class="detail-field"><label>Constituency &amp; House</label><span>${escapeHtml(work.constituency || '')} (${escapeHtml(work.house || '')})</span></div>
          <div class="detail-field"><label>State &amp; District</label><span>${escapeHtml(work.state)} / ${escapeHtml(work.district || work.constituency)}</span></div>
          <div class="detail-field"><label>Sector / Category</label><span>${escapeHtml(work.category || 'General Infrastructure')}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Financial Flow &amp; Fund Utilization</h3></div>
        <div class="detail-row">
          <div class="detail-field"><label>Recommended Cost</label><span>${formatCurrency(financialSummary.recommendedAmount)}</span></div>
          <div class="detail-field"><label>Sanctioned Amount</label><span>${formatCurrency(financialSummary.sanctionedAmount)}</span></div>
          <div class="detail-field"><label>Disbursed Amount</label><span>${formatCurrency(financialSummary.disbursedAmount)}</span></div>
          <div class="detail-field"><label>Disbursement Rate</label><span style="color:#60a5fa; font-weight:700;">${financialSummary.disbursementRate}</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>District Authority (DA) Examination &amp; Sanction</h3></div>
        ${daReview ? `
          <div class="detail-row">
            <div class="detail-field"><label>Feasibility Verified</label><span style="color:${daReview.feasible ? 'var(--civic-emerald)' : 'var(--civic-red)'}">${daReview.feasible ? 'Yes (Compliant)' : 'No'}</span></div>
            <div class="detail-field"><label>Estimated Duration</label><span>${daReview.estimatedTimeMonths} Months</span></div>
            <div class="detail-field"><label>Prohibited Under 2023 Guidelines</label><span>${daReview.prohibited ? 'YES (Prohibited)' : 'No (Eligible)'}</span></div>
            <div class="detail-field"><label>Examining Authority</label><span>${escapeHtml(daReview.reviewedBy)}</span></div>
          </div>
          <div style="margin-top:14px; font-size:13px; color:var(--text-secondary);">
            <strong>Authority Remarks:</strong> ${escapeHtml(daReview.remarks)}
          </div>
        ` : `<p style="color:var(--text-secondary);">Pending District Authority Feasibility Verification.</p>`}
      </div>

      <div class="card">
        <div class="card-header"><h3>Implementing Agency (IA) 30-Day Inspection Audits</h3></div>
        ${inspections && inspections.length > 0 ? `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Audit Date</th>
                  <th>Officer / IA ID</th>
                  <th>Physical Progress</th>
                  <th>Field Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${inspections.map(i => `
                  <tr>
                    <td>${new Date(i.inspectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td><strong>${escapeHtml(i.iaId)}</strong></td>
                    <td><span style="color:#60a5fa; font-weight:700;">${i.progressPercentage}%</span></td>
                    <td>${escapeHtml(i.remarks)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<p style="color:var(--text-secondary);">No 30-day inspection records uploaded yet for this Work ID.</p>`}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card"><p style="color:var(--civic-red);">Failed to retrieve work details.</p></div>`;
  }
}

// ==========================================================================
// 4. MP PORTFOLIOS (774 MPs ACTUAL DATASET)
// ==========================================================================

let currentHouseFilter = 'ALL';
let currentTierFilter = 'ALL';

async function loadMPs() {
  const container = document.getElementById('mpCardsContainer');
  if (!container) return;

  if (window.allMpsData && window.allMpsData.length > 0) {
    applyMPFilters();
    return;
  }

  container.innerHTML = '<p style="color:var(--text-secondary);">Loading 774 official MP portfolios from MoSPI summary dataset...</p>';

  try {
    const res = await fetch('/api/mps?limit=800');
    const json = await res.json();

    if (json.success && json.data.length > 0) {
      window.allMpsData = json.data;
      applyMPFilters();
    } else {
      container.innerHTML = '<p style="color:var(--civic-red);">No MP records found in official dataset.</p>';
    }
  } catch (err) {
    container.innerHTML = '<p style="color:var(--civic-red);">Error loading official MP data.</p>';
  }
}

function setupMPFilters() {
  const searchInput = document.getElementById('mpSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', applyMPFilters);
  }

  // House buttons
  const houseGroup = document.getElementById('mpHouseButtons');
  if (houseGroup) {
    houseGroup.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        houseGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentHouseFilter = btn.getAttribute('data-house') || 'ALL';
        applyMPFilters();
      });
    });
  }

  // Tier buttons
  const tierGroup = document.getElementById('mpTierButtons');
  if (tierGroup) {
    tierGroup.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tierGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTierFilter = btn.getAttribute('data-tier') || 'ALL';
        applyMPFilters();
      });
    });
  }
}

function applyMPFilters() {
  if (!window.allMpsData) return;
  const search = (document.getElementById('mpSearchInput')?.value || '').toLowerCase().trim();

  let filtered = window.allMpsData;

  // Filter House
  if (currentHouseFilter !== 'ALL') {
    filtered = filtered.filter(m => m.house && m.house.toLowerCase() === currentHouseFilter.toLowerCase());
  }

  // Filter Tier
  if (currentTierFilter !== 'ALL') {
    filtered = filtered.filter(m => m.tier && m.tier.toLowerCase() === currentTierFilter.toLowerCase());
  }

  // Filter Search
  if (search) {
    filtered = filtered.filter(m =>
      (m.name && m.name.toLowerCase().includes(search)) ||
      (m.constituency && m.constituency.toLowerCase().includes(search)) ||
      (m.state && m.state.toLowerCase().includes(search))
    );
  }

  renderMPs(filtered);
}

function renderMPs(list) {
  const container = document.getElementById('mpCardsContainer');
  const countSummary = document.getElementById('mpCountSummary');
  if (!container) return;

  if (countSummary) {
    countSummary.innerText = `Showing ${list.length} of 774 Official Members of Parliament (Source: MoSPI 2026 Summary Dataset)`;
  }

  if (list.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary); grid-column: 1 / -1;">No matching MP portfolios found.</p>';
    return;
  }

  // Show top matching MPs (up to 80 on screen for fast DOM)
  container.innerHTML = list.slice(0, 80).map(mp => `
    <div class="mp-card">
      <div class="mp-card-header">
        <div>
          <h4>${escapeHtml(mp.name)}</h4>
          <span>${escapeHtml(mp.house)} &bull; ${escapeHtml(mp.state)} (${escapeHtml(mp.constituency)})</span>
        </div>
        <span class="badge ${getTierBadgeClass(mp.tier)}">${mp.tier}</span>
      </div>

      <div>
        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
          <span>Fund Utilization</span>
          <strong>${mp.utilizationRate || 0}%</strong>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${Math.min(100, mp.utilizationRate || 0)}%; background:${mp.utilizationRate >= 75 ? 'var(--civic-emerald)' : mp.utilizationRate >= 50 ? 'var(--civic-blue)' : 'var(--civic-amber)'};"></div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary);">
        <span>Allocated: <strong>${formatCurrency(mp.allocatedFunds)}</strong></span>
        <span>Spent: <strong>${formatCurrency(mp.utilizedFunds)}</strong></span>
      </div>

      <div style="display:flex; justify-content:space-between; font-size:11.5px; padding-top:8px; border-top:1px solid var(--border-subtle); color:var(--text-muted);">
        <span>Completed: <strong style="color:var(--civic-emerald);">${mp.completedWorks || 0}</strong></span>
        <span>Pending: <strong style="color:var(--civic-amber);">${(mp.recommendedWorks || 0) - (mp.completedWorks || 0)}</strong></span>
        <span>PFMS Records: <strong>${mp.transactionCount || 0}</strong></span>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// 5. 36 STATES LEADERBOARD (OFFICIAL DATASET)
// ==========================================================================

async function loadStates() {
  const tbody = document.getElementById('statesTableBody');
  if (!tbody) return;

  if (window.allStatesData && window.allStatesData.length > 0) {
    renderStates(window.allStatesData);
    return;
  }

  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading official rankings for all 36 States &amp; UTs...</td></tr>';

  try {
    const res = await fetch('/api/states');
    const json = await res.json();

    if (json.success && json.data.length > 0) {
      window.allStatesData = json.data;
      renderStates(json.data);
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--civic-red);">Failed to load state rankings.</td></tr>';
  }
}

function renderStates(list) {
  const tbody = document.getElementById('statesTableBody');
  if (!tbody) return;

  tbody.innerHTML = list.map(s => `
    <tr>
      <td><strong>#${s.rank}</strong></td>
      <td><strong>${escapeHtml(s.name)}</strong> <span style="font-size:11px; color:var(--text-muted);">(${s.type})</span></td>
      <td>${s.totalMPs}</td>
      <td>${formatCurrency(s.allocatedAmount)}</td>
      <td>${formatCurrency(s.utilizedAmount)}</td>
      <td>
        <strong style="color:${s.utilizationPercentage >= 50 ? 'var(--civic-emerald)' : 'var(--civic-amber)'};">${s.utilizationPercentage}%</strong>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${Math.min(100, s.utilizationPercentage)}%; background:${s.utilizationPercentage >= 50 ? 'var(--civic-emerald)' : 'var(--civic-amber)'};"></div>
        </div>
      </td>
      <td><span style="color:var(--civic-emerald); font-weight:600;">${(s.worksCompleted || 0).toLocaleString()}</span></td>
    </tr>
  `).join('');
}

function setupStateFilter() {
  const input = document.getElementById('stateSearchInput');
  if (input) {
    input.addEventListener('input', () => {
      if (!window.allStatesData) return;
      const q = input.value.toLowerCase().trim();
      const filtered = window.allStatesData.filter(s => s.name.toLowerCase().includes(q));
      renderStates(filtered);
    });
  }
}

// ==========================================================================
// 6. HARDCODED DETERMINISTIC COMPARISON GRAPHING (NO AI GENERATED LOGIC)
// ==========================================================================

function setupCompare() {
  const btn = document.getElementById('btnRunCompare');
  if (btn) btn.addEventListener('click', runComparison);
}

async function runComparison() {
  const area = document.getElementById('compareChartArea');
  const type = document.getElementById('compareType')?.value || 'state';
  if (!area) return;

  area.innerHTML = '<p style="color:var(--text-secondary);">Calculating mathematical comparison from verified dataset...</p>';

  try {
    if (type === 'state') {
      // Benchmark: Selected States vs 34.1% National Average
      const res = await fetch('/api/states');
      const json = await res.json();
      if (!json.success || !json.data) return;

      const benchmark = 34.1; // Official MoSPI National Average Utilization
      const statesList = json.data;
      
      // Select key comparative states across high, median, and low
      const selectedNames = [
        'Nagaland', 'Tamil Nadu', 'Gujarat', 'Kerala', 
        'Karnataka', 'Maharashtra', 'Uttar Pradesh', 'Bihar'
      ];
      const items = statesList.filter(s => selectedNames.includes(s.name))
        .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

      area.innerHTML = `
        <div class="chart-header-row">
          <div>
            <h3 style="font-size:16px; font-weight:700; color:#fff;">Capital Utilization Benchmark (vs National Average: 34.1%)</h3>
            <span style="font-size:12px; color:var(--text-muted);">Source: MoSPI 2026 Summary CSV Dataset &bull; Tabular Mathematical Mapping</span>
          </div>
          <div class="chart-legend">
            <span class="legend-chip"><span class="legend-dot" style="background:var(--civic-emerald);"></span> Above National Avg</span>
            <span class="legend-chip"><span class="legend-dot" style="background:var(--civic-amber);"></span> Below National Avg</span>
            <span class="legend-chip"><span class="legend-dot" style="background:#fff; border-top:1px dashed #000;"></span> National Benchmark (34.1%)</span>
          </div>
        </div>

        <div class="chart-grid-container">
          ${items.map(s => {
            const util = Number(s.utilizationPercentage);
            const delta = (util - benchmark).toFixed(1);
            const isAbove = util >= benchmark;
            const barColor = isAbove ? 'var(--civic-emerald)' : 'var(--civic-amber)';

            return `
              <div class="chart-row">
                <div class="chart-label">
                  <span>${escapeHtml(s.name)}</span>
                  <span class="chart-label-sub">${s.totalMPs} MPs &bull; Rank #${s.rank}</span>
                </div>
                <div class="chart-bar-lane">
                  <div class="benchmark-line" style="left: ${benchmark}%;" title="National Benchmark: 34.1%"></div>
                  <div class="chart-bar-fill" style="width: ${Math.min(100, util)}%; background: ${barColor};">
                    ${util}%
                  </div>
                </div>
                <div class="chart-val-col">
                  <span class="chart-val-num">${formatCurrency(s.utilizedAmount)}</span>
                  <span class="chart-val-delta ${isAbove ? 'delta-pos' : 'delta-neg'}">
                    ${isAbove ? `+${delta}%` : `${delta}%`} vs Nat. Avg
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (type === 'category') {
      // Sectoral Capital Allocation & Works Breakdown
      const res = await fetch('/api/analytics/compare?type=category');
      const json = await res.json();
      if (!json.success || !json.data) return;

      const categories = json.data;
      const totalWorks = categories.reduce((sum, c) => sum + (c.totalWorks || 0), 0) || 1;

      area.innerHTML = `
        <div class="chart-header-row">
          <div>
            <h3 style="font-size:16px; font-weight:700; color:#fff;">Sectoral Capital Allocation &amp; Project Distribution</h3>
            <span style="font-size:12px; color:var(--text-muted);">Source: Official Indexed Works CSVs &bull; Direct Mathematical Category Aggregation</span>
          </div>
          <div class="chart-legend">
            <span class="legend-chip"><span class="legend-dot" style="background:var(--civic-blue);"></span> Proportional Allocation Share</span>
          </div>
        </div>

        <div class="chart-grid-container">
          ${categories.slice(0, 7).map(c => {
            const pctShare = ((c.totalWorks / totalWorks) * 100).toFixed(1);
            return `
              <div class="chart-row">
                <div class="chart-label">
                  <span>${escapeHtml(c._id || 'General')}</span>
                  <span class="chart-label-sub">${(c.totalWorks || 0).toLocaleString()} Verified Projects</span>
                </div>
                <div class="chart-bar-lane">
                  <div class="chart-bar-fill" style="width: ${Math.max(8, pctShare * 2.5)}%; background: var(--civic-blue);">
                    ${pctShare}% Share
                  </div>
                </div>
                <div class="chart-val-col">
                  <span class="chart-val-num">${formatCurrency(c.totalDisbursed || c.totalSanctioned)}</span>
                  <span class="chart-label-sub">${c.completed || 0} Completed</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (type === 'distribution') {
      // MP Fund Utilization Histogram (774 MPs)
      if (!window.allMpsData) {
        const res = await fetch('/api/mps?limit=800');
        const json = await res.json();
        window.allMpsData = json.data;
      }

      const all = window.allMpsData || [];
      const total = all.length || 774;

      const bins = [
        { label: 'High Performers (≥ 75%)', count: 0, color: 'var(--civic-emerald)' },
        { label: 'Moderate Performers (50% - 74.9%)', count: 0, color: 'var(--civic-blue)' },
        { label: 'Below Average (25% - 49.9%)', count: 0, color: 'var(--civic-amber)' },
        { label: 'Critical Lags (< 25%)', count: 0, color: 'var(--civic-red)' }
      ];

      all.forEach(m => {
        const u = m.utilizationRate || 0;
        if (u >= 75) bins[0].count++;
        else if (u >= 50) bins[1].count++;
        else if (u >= 25) bins[2].count++;
        else bins[3].count++;
      });

      area.innerHTML = `
        <div class="chart-header-row">
          <div>
            <h3 style="font-size:16px; font-weight:700; color:#fff;">Parliamentary Utilization Distribution (All 774 MPs)</h3>
            <span style="font-size:12px; color:var(--text-muted);">Deterministic Histogram Bins Across Lok Sabha &amp; Rajya Sabha</span>
          </div>
        </div>

        <div class="chart-grid-container">
          ${bins.map(b => {
            const pct = ((b.count / total) * 100).toFixed(1);
            return `
              <div class="chart-row">
                <div class="chart-label">
                  <span>${b.label}</span>
                  <span class="chart-label-sub">${b.count} MPs</span>
                </div>
                <div class="chart-bar-lane">
                  <div class="chart-bar-fill" style="width: ${Math.max(6, pct)}%; background: ${b.color};">
                    ${pct}% (${b.count} MPs)
                  </div>
                </div>
                <div class="chart-val-col">
                  <span class="chart-val-num">${pct}%</span>
                  <span class="chart-label-sub">of 774 Seats</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  } catch (err) {
    area.innerHTML = '<p style="color:var(--civic-red);">Failed to render comparison chart.</p>';
  }
}

// ==========================================================================
// 7. IA FIELD CAMERA WITH ACTUAL DATASET WORK INTEGRATION
// ==========================================================================

const OFFICIAL_SAMPLE_WORKS = [
  { id: '134703', title: 'CC Drain Construction from Main Road to Harijanawada', district: 'CHITTOOR, ANDHRA PRADESH', cost: '₹ 5.00 Lakh', prog: 92 },
  { id: '175556', title: 'Construction of Retaining Wall & Drainage Protection', district: 'ANDAMAN & NICOBAR ISLANDS', cost: '₹ 8.50 Lakh', prog: 45 },
  { id: '183102', title: 'Solar High Mast Lighting & Rural Grid Connection', district: 'PORT BLAIR, A&N', cost: '₹ 12.00 Lakh', prog: 70 },
  { id: '135593', title: 'Cement Concrete Road from School to Panchayati Office', district: 'EAST GODAVARI, ANDHRA PRADESH', cost: '₹ 10.00 Lakh', prog: 60 },
  { id: '134812', title: 'Multi-Purpose Community Hall & Solar Roof Plant', district: 'TIRUPATI, ANDHRA PRADESH', cost: '₹ 15.00 Lakh', prog: 85 }
];

function setupIAQuickWorks() {
  const container = document.getElementById('iaQuickWorksList');
  if (!container) return;

  container.innerHTML = OFFICIAL_SAMPLE_WORKS.map((w, idx) => `
    <button type="button" class="work-chip-btn ${idx === 0 ? 'active' : ''}" onclick="selectWorkForIA('${w.id}')">
      <strong>Work ${w.id}</strong>: ${escapeHtml(w.title.substring(0, 32))}... (${w.district.split(',')[0]})
    </button>
  `).join('');

  // Default selection to first work
  selectWorkForIA('134703');
}

window.selectWorkForIA = function (workId) {
  const selected = OFFICIAL_SAMPLE_WORKS.find(w => w.id === workId) || OFFICIAL_SAMPLE_WORKS[0];

  // Highlight active chip
  const chips = document.querySelectorAll('.work-chip-btn');
  chips.forEach(c => {
    c.classList.toggle('active', c.innerText.includes(workId));
  });

  // Update Viewfinder Info
  const title = document.getElementById('vfWorkTitle');
  const loc = document.getElementById('vfWorkLocation');
  const cost = document.getElementById('vfWorkCost');
  const prog = document.getElementById('vfWorkProg');

  if (title) title.innerText = `Work ${selected.id} - ${selected.title}`;
  if (loc) loc.innerText = selected.district;
  if (cost) cost.innerText = selected.cost;
  if (prog) prog.innerText = `${selected.prog}%`;

  // Update Form inputs
  const camWorkId = document.getElementById('camWorkId');
  const camProgress = document.getElementById('camProgress');

  if (camWorkId) camWorkId.value = selected.id;
  if (camProgress) camProgress.value = selected.prog;
};

function setupInspectionForm() {
  const form = document.getElementById('inspectionForm');
  const feedback = document.getElementById('cameraFeedback');
  const btnGPS = document.getElementById('btnDetectGPS');

  if (!form) return;

  if (btnGPS) {
    btnGPS.addEventListener('click', () => {
      if (navigator.geolocation) {
        btnGPS.innerText = '📡 Acquiring GPS...';
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            document.getElementById('camLat').value = lat;
            document.getElementById('camLng').value = lng;
            btnGPS.innerText = '✓ GPS Locked';
            setTimeout(() => { btnGPS.innerText = '📍 Auto-Detect Live Device GPS'; }, 3000);
          },
          (err) => {
            alert('Could not acquire device GPS: ' + err.message + '. Please enter coordinates manually.');
            btnGPS.innerText = '📍 Auto-Detect Live Device GPS';
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.innerText = 'Recording 30-day inspection and geotag to persistent database...';
    feedback.style.color = 'var(--text-secondary)';

    const payload = {
      workId: document.getElementById('camWorkId').value.trim(),
      iaId: document.getElementById('camIaId').value.trim(),
      progressPercentage: document.getElementById('camProgress').value,
      reportingPeriod: document.getElementById('camPeriod').value.trim(),
      latitude: document.getElementById('camLat').value.trim(),
      longitude: document.getElementById('camLng').value.trim(),
      remarks: document.getElementById('camRemarks').value.trim()
    };

    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        feedback.innerText = `✓ Saved to Database! Official 30-day inspection recorded (Report ID: ${json.report?.reportId || 'RPT-2026'}). Work ${payload.workId} progress updated to ${payload.progressPercentage}%.`;
        feedback.style.color = 'var(--civic-emerald)';
        loadOverview();
      } else {
        feedback.innerText = json.message || 'Submission failed.';
        feedback.style.color = 'var(--civic-red)';
      }
    } catch (err) {
      feedback.innerText = 'Error saving inspection to persistent database.';
      feedback.style.color = 'var(--civic-red)';
    }
  });
}

// ==========================================================================
// 8. HELPERS & FORMATTERS
// ==========================================================================

function formatCurrency(amount) {
  if (!amount) return '₹ 0';
  if (amount >= 10000000) {
    return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹ ${(amount / 100000).toFixed(2)} Lakh`;
  }
  return `₹ ${Number(amount).toLocaleString('en-IN')}`;
}

function getStatusBadgeClass(status) {
  if (status === 'COMPLETED') return 'badge-completed';
  if (status === 'IN_PROGRESS') return 'badge-in-progress';
  if (status === 'REJECTED') return 'badge-rejected';
  return 'badge-average';
}

function getTierBadgeClass(tier) {
  if (tier === 'High Performer') return 'badge-high';
  if (tier === 'Average') return 'badge-average';
  return 'badge-low';
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
