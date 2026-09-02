const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const Work = require('../models/Work');
const MP = require('../models/MP');
const State = require('../models/State');
const DAReview = require('../models/DAReview');
const Inspection = require('../models/Inspection');
const Photo = require('../models/Photo');
const Report = require('../models/Report');

const seed = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Seeding data...');

    await Promise.all([
      Work.deleteMany({}),
      MP.deleteMany({}),
      State.deleteMany({}),
      DAReview.deleteMany({}),
      Inspection.deleteMany({}),
      Photo.deleteMany({}),
      Report.deleteMany({})
    ]);

    // 1. States
    const statesData = [
      { stateId: 'MH', name: 'Maharashtra', type: 'State', totalMPs: 48, allocatedAmount: 2400000000, utilizedAmount: 1848000000, worksCompleted: 1420, worksPending: 380 },
      { stateId: 'KA', name: 'Karnataka', type: 'State', totalMPs: 28, allocatedAmount: 1400000000, utilizedAmount: 994000000, worksCompleted: 830, worksPending: 290 },
      { stateId: 'GJ', name: 'Gujarat', type: 'State', totalMPs: 26, allocatedAmount: 1300000000, utilizedAmount: 1040000000, worksCompleted: 890, worksPending: 210 },
      { stateId: 'TN', name: 'Tamil Nadu', type: 'State', totalMPs: 39, allocatedAmount: 1950000000, utilizedAmount: 1618500000, worksCompleted: 1310, worksPending: 310 },
      { stateId: 'UP', name: 'Uttar Pradesh', type: 'State', totalMPs: 80, allocatedAmount: 4000000000, utilizedAmount: 2680000000, worksCompleted: 2150, worksPending: 920 }
    ];
    await State.insertMany(statesData);

    // 2. MPs
    const mpsData = [
      { mpId: 'MP-2024-001', name: 'Supriya Sule', house: 'Lok Sabha', state: 'Maharashtra', constituency: 'Baramati', allocatedFunds: 50000000, utilizedFunds: 43500000 },
      { mpId: 'MP-2024-002', name: 'Tejasvi Surya', house: 'Lok Sabha', state: 'Karnataka', constituency: 'Bangalore South', allocatedFunds: 50000000, utilizedFunds: 38000000 },
      { mpId: 'MP-2024-003', name: 'Nitin Gadkari', house: 'Lok Sabha', state: 'Maharashtra', constituency: 'Nagpur', allocatedFunds: 50000000, utilizedFunds: 47200000 },
      { mpId: 'MP-2024-004', name: 'Kanimozhi Karunanidhi', house: 'Lok Sabha', state: 'Tamil Nadu', constituency: 'Thoothukkudi', allocatedFunds: 50000000, utilizedFunds: 41500000 }
    ];
    await MP.insertMany(mpsData);

    // 3. Works
    const work1 = await Work.create({
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
      sanctionDate: new Date('2025-06-15'),
      anticipatedCompletionDate: new Date('2026-03-30'),
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204],
        address: 'Daund Gram Panchayat, Baramati',
        block: 'Daund',
        village: 'Khadki'
      }
    });

    const work2 = await Work.create({
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
      sanctionDate: new Date('2025-04-10'),
      anticipatedCompletionDate: new Date('2025-11-30'),
      actualCompletionDate: new Date('2025-11-20'),
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716],
        address: 'Jayanagar 4th Block, Bengaluru',
        block: 'South-3',
        village: 'Jayanagar'
      }
    });

    // 4. DA Review for work 1
    await DAReview.create({
      workId: work1.workId,
      feasible: true,
      estimatedTimeMonths: 8,
      prohibited: false,
      remarks: 'Technical estimate verified by Executive Engineer. Work is within MPLADS guidelines.',
      reviewedBy: 'District Collector, Pune'
    });

    // 5. Geotagged Photo
    const photo = await Photo.create({
      workId: work1.workId,
      filePath: '/uploads/photos/sample_water_plant.jpg',
      fileName: 'water_plant_progress.jpg',
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204]
      },
      capturedAt: new Date('2026-01-10T11:20:00Z'),
      exifData: {
        camera: 'Field Camera v2.1',
        gpsAccuracyMeters: 2.4,
        deviceModel: 'Android Rugged Tab'
      }
    });

    // 6. Inspection
    const inspection = await Inspection.create({
      workId: work1.workId,
      iaId: 'IA-PUNE-RURAL-04',
      inspectionDate: new Date('2026-01-10'),
      progressPercentage: 85,
      remarks: 'Water filtration RO tanks installed. Solar inverter wiring underway.',
      photos: [photo._id]
    });

    // 7. Report
    await Report.create({
      reportId: 'RPT-2026-00001',
      workId: work1.workId,
      inspectionId: inspection._id,
      reportingPeriod: 'Cycle January 2026',
      submittedDate: new Date('2026-01-10'),
      status: 'VERIFIED_BY_NODAL',
      remarks: 'Submitted on 10th per protocol. 1% random audit approved.'
    });

    console.log('[Seed] Data successfully populated!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seed();
}

module.exports = seed;
