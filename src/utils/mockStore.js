/**
 * Hackathon In-Memory Fallback Store
 * Ensures the platform always functions during live demos/evaluations even if MongoDB is offline.
 */

const mockStates = [
  { rank: 1, stateId: 'MH', name: 'Maharashtra', type: 'State', totalMPs: 48, allocatedAmount: 2400000000, utilizedAmount: 1848000000, utilizationPercentage: 77.0, worksCompleted: 1420, worksPending: 380 },
  { rank: 2, stateId: 'TN', name: 'Tamil Nadu', type: 'State', totalMPs: 39, allocatedAmount: 1950000000, utilizedAmount: 1618500000, utilizationPercentage: 83.0, worksCompleted: 1310, worksPending: 310 },
  { rank: 3, stateId: 'GJ', name: 'Gujarat', type: 'State', totalMPs: 26, allocatedAmount: 1300000000, utilizedAmount: 1040000000, utilizationPercentage: 80.0, worksCompleted: 890, worksPending: 210 },
  { rank: 4, stateId: 'KA', name: 'Karnataka', type: 'State', totalMPs: 28, allocatedAmount: 1400000000, utilizedAmount: 994000000, utilizationPercentage: 71.0, worksCompleted: 830, worksPending: 290 },
  { rank: 5, stateId: 'UP', name: 'Uttar Pradesh', type: 'State', totalMPs: 80, allocatedAmount: 4000000000, utilizedAmount: 2680000000, utilizationPercentage: 67.0, worksCompleted: 2150, worksPending: 920 }
];

const mockMPs = [
  { mpId: 'MP-2024-001', name: 'Supriya Sule', house: 'Lok Sabha', state: 'Maharashtra', constituency: 'Baramati', allocatedFunds: 50000000, utilizedFunds: 43500000, utilizationRate: 87.0, tier: 'High Performer' },
  { mpId: 'MP-2024-002', name: 'Tejasvi Surya', house: 'Lok Sabha', state: 'Karnataka', constituency: 'Bangalore South', allocatedFunds: 50000000, utilizedFunds: 38000000, utilizationRate: 76.0, tier: 'High Performer' },
  { mpId: 'MP-2024-003', name: 'Nitin Gadkari', house: 'Lok Sabha', state: 'Maharashtra', constituency: 'Nagpur', allocatedFunds: 50000000, utilizedFunds: 47200000, utilizationRate: 94.4, tier: 'High Performer' },
  { mpId: 'MP-2024-004', name: 'Kanimozhi Karunanidhi', house: 'Lok Sabha', state: 'Tamil Nadu', constituency: 'Thoothukkudi', allocatedFunds: 50000000, utilizedFunds: 41500000, utilizationRate: 83.0, tier: 'High Performer' }
];

const mockWorks = [
  {
    workId: 'MPLADS/2026/00125',
    mpId: 'MP-2024-001',
    state: 'Maharashtra',
    district: 'Pune',
    constituency: 'Baramati',
    department: 'Rural Development',
    description: 'Construction of Community Drinking Water Purification Plant and Solar Pump',
    category: 'Water Supply',
    recommendedAmount: 2500000,
    sanctionedAmount: 2450000,
    disbursedAmount: 2200000,
    status: 'IN_PROGRESS',
    physicalProgress: 85,
    sanctionDate: '2025-06-15T00:00:00.000Z',
    anticipatedCompletionDate: '2026-03-30T00:00:00.000Z',
    location: { type: 'Point', coordinates: [73.8567, 18.5204], address: 'Daund Gram Panchayat, Baramati' }
  },
  {
    workId: 'MPLADS/2026/00126',
    mpId: 'MP-2024-002',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    constituency: 'Bangalore South',
    department: 'Primary Education',
    description: 'Upgradation of Smart Classrooms and Science Laboratory in Govt High School',
    category: 'Education',
    recommendedAmount: 3500000,
    sanctionedAmount: 3500000,
    disbursedAmount: 3500000,
    status: 'COMPLETED',
    physicalProgress: 100,
    sanctionDate: '2025-04-10T00:00:00.000Z',
    anticipatedCompletionDate: '2025-11-30T00:00:00.000Z',
    location: { type: 'Point', coordinates: [77.5946, 12.9716], address: 'Jayanagar 4th Block, Bengaluru' }
  },
  {
    workId: 'MPLADS/2026/00127',
    mpId: 'MP-2024-003',
    state: 'Maharashtra',
    district: 'Nagpur',
    constituency: 'Nagpur',
    department: 'Public Works',
    description: 'Installation of Solar High Mast Lights at Key Junctions and Bus Stands',
    category: 'Infrastructure',
    recommendedAmount: 1800000,
    sanctionedAmount: 1800000,
    disbursedAmount: 1200000,
    status: 'IN_PROGRESS',
    physicalProgress: 65,
    sanctionDate: '2025-08-20T00:00:00.000Z',
    location: { type: 'Point', coordinates: [79.0882, 21.1458], address: 'Sitabuldi Square, Nagpur' }
  }
];

const mockDAReviews = {
  'MPLADS/2026/00125': {
    workId: 'MPLADS/2026/00125',
    feasible: true,
    estimatedTimeMonths: 8,
    prohibited: false,
    remarks: 'Technical site estimate and hydro-geological survey verified. Eligible under MPLADS 2023 Guidelines.',
    reviewedBy: 'District Collector, Pune'
  }
};

const mockInspections = {
  'MPLADS/2026/00125': [
    {
      workId: 'MPLADS/2026/00125',
      iaId: 'IA-PUNE-RURAL-04',
      inspectionDate: '2026-01-10T00:00:00.000Z',
      progressPercentage: 85,
      remarks: 'Filtration plant building complete. Solar panels and battery inverter bank installed and connected.'
    }
  ]
};

const mockPhotos = {
  'MPLADS/2026/00125': [
    {
      workId: 'MPLADS/2026/00125',
      fileName: 'geotag_water_filtration_plant.jpg',
      filePath: '/uploads/photos/sample_water_plant.jpg',
      location: { type: 'Point', coordinates: [73.8567, 18.5204] },
      capturedAt: '2026-01-10T11:20:00.000Z'
    }
  ]
};

module.exports = {
  mockStates,
  mockMPs,
  mockWorks,
  mockDAReviews,
  mockInspections,
  mockPhotos
};
