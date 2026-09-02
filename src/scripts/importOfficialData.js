/**
 * Import Official MPLADS Dataset (CSV / Excel)
 * Implements README Section 8 & Section 9:
 * - Reads official CSV/XLSX
 * - Inspects columns
 * - Cleans and normalizes fields
 * - Validates Work IDs
 * - Imports into MongoDB
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const Work = require('../models/Work');
const MP = require('../models/MP');
const State = require('../models/State');
const { normalizeStatus, parseAmount, parseDate, normalizeText } = require('../utils/dataCleaner');

const importFile = async (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`[Error] File not found: ${filePath}`);
    console.log(`Usage: node src/scripts/importOfficialData.js <path-to-dataset.csv-or-xlsx>`);
    process.exit(1);
  }

  await connectDB();
  console.log(`\n======================================================`);
  console.log(`[Import] Processing official dataset: ${filePath}`);
  console.log(`======================================================\n`);

  const ext = path.extname(filePath).toLowerCase();
  let rows = [];

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = xlsx.utils.sheet_to_json(sheet);
    console.log(`[Inspection] Read ${rows.length} rows from Excel sheet '${sheetName}'.`);
  } else if (ext === '.csv') {
    rows = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
    console.log(`[Inspection] Read ${rows.length} rows from CSV.`);
  } else {
    console.error('[Error] Unsupported format. Please provide .csv, .xls, or .xlsx file.');
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('[Warning] No records found in the file.');
    process.exit(0);
  }

  // Column Inspection
  const sample = rows[0];
  console.log('[Inspection] Detected Columns:');
  console.log(Object.keys(sample).join(', '));
  console.log('\n--- Sample Record (First Row) ---');
  console.log(JSON.stringify(sample, null, 2));

  let importedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    // Dynamically match known column variants
    const rawWorkId = row['Work ID'] || row['workId'] || row['WORK_ID'] || row['WorkId'] || row['ID'];
    const rawDescription = row['Description'] || row['Work Description'] || row['Work Name'] || row['description'] || 'MPLADS Work';
    const rawState = row['State'] || row['State Name'] || row['state'] || 'Unknown State';
    const rawDistrict = row['District'] || row['District Name'] || row['district'] || 'Unknown District';
    const rawConstituency = row['Constituency'] || row['constituency'] || '';
    const rawSanctioned = row['Sanctioned Amount'] || row['Sanctioned (Rs)'] || row['sanctionedAmount'];
    const rawDisbursed = row['Disbursed Amount'] || row['Expenditure'] || row['disbursedAmount'];
    const rawRecommended = row['Recommended Amount'] || row['Cost'] || row['recommendedAmount'];
    const rawStatus = row['Status'] || row['Work Status'] || row['status'];
    const rawCategory = row['Sector'] || row['Category'] || row['category'] || 'Other';

    if (!rawWorkId) {
      skippedCount++;
      continue;
    }

    const workData = {
      workId: normalizeText(rawWorkId),
      description: normalizeText(rawDescription),
      state: normalizeText(rawState),
      district: normalizeText(rawDistrict),
      constituency: normalizeText(rawConstituency),
      sanctionedAmount: parseAmount(rawSanctioned),
      disbursedAmount: parseAmount(rawDisbursed),
      recommendedAmount: parseAmount(rawRecommended),
      status: normalizeStatus(rawStatus),
      category: rawCategory,
      sanctionDate: parseDate(row['Sanction Date'] || row['Date']),
      actualCompletionDate: parseDate(row['Completion Date'])
    };

    try {
      await Work.findOneAndUpdate(
        { workId: workData.workId },
        { $set: workData },
        { upsert: true }
      );
      importedCount++;
    } catch (err) {
      console.error(`[Error] Failed to upsert Work ID ${workData.workId}: ${err.message}`);
      skippedCount++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`[Import Complete] Successfully imported/updated: ${importedCount} works`);
  if (skippedCount > 0) {
    console.log(`[Import Complete] Skipped (missing Work ID / errors): ${skippedCount} rows`);
  }
  console.log(`======================================================\n`);
  process.exit(0);
};

const targetPath = process.argv[2];
if (require.main === module) {
  importFile(targetPath);
}

module.exports = importFile;
