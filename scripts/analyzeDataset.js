const fs = require('fs');
const readline = require('readline');

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

async function run() {
  // 1. Read MP Summary
  const mpLines = fs.readFileSync('dataset/mplads_mp_summary_2026-09-02.csv', 'utf-8').split('\n').filter(Boolean);
  const mpHeader = parseCSVLine(mpLines[0]);
  console.log('MP Summary Header:', mpHeader);
  console.log('Total MPs in CSV:', mpLines.length - 1);

  // States summary
  const stateStats = {};
  for (let i = 1; i < mpLines.length; i++) {
    const cols = parseCSVLine(mpLines[i]);
    const state = cols[2];
    const alloc = parseFloat(cols[4]) || 0;
    const exp = parseFloat(cols[5]) || 0;
    const completed = parseInt(cols[7]) || 0;
    const rec = parseInt(cols[8]) || 0;
    if (!stateStats[state]) {
      stateStats[state] = { state, count: 0, alloc: 0, exp: 0, completed: 0, rec: 0 };
    }
    stateStats[state].count++;
    stateStats[state].alloc += alloc;
    stateStats[state].exp += exp;
    stateStats[state].completed += completed;
    stateStats[state].rec += rec;
  }
  console.log('Total States:', Object.keys(stateStats).length);
  console.log('Karnataka in MP summary:', stateStats['Karnataka']);

  // Check Mysore works in recommended
  const recStream = readline.createInterface({
    input: fs.createReadStream('dataset/mplads_recommended_works_2026-09-02.csv'),
    crlfDelay: Infinity,
  });

  let recHeader = null;
  let mysoreRec = [];
  let totalRec = 0;
  for await (const line of recStream) {
    if (!recHeader) {
      recHeader = parseCSVLine(line);
      continue;
    }
    totalRec++;
    const row = parseCSVLine(line);
    // col 3 is MP Name, col 4 is Constituency, col 5 is State
    if (row[3]?.toUpperCase().includes('YADUVEER') || row[4]?.toUpperCase() === 'MYSORE' || row[4]?.toUpperCase() === 'MYSURU') {
      mysoreRec.push(row);
    }
  }
  console.log('Total recommended works counted:', totalRec);
  console.log('Mysore recommended works counted:', mysoreRec.length);
  if (mysoreRec[0]) {
    console.log('Sample Mysore rec work:', mysoreRec[0]);
  }

  // Check completed works
  const compStream = readline.createInterface({
    input: fs.createReadStream('dataset/mplads_completed_works_2026-09-02.csv'),
    crlfDelay: Infinity,
  });

  let compHeader = null;
  let mysoreComp = [];
  let totalComp = 0;
  for await (const line of compStream) {
    if (!compStream) continue;
    if (!compHeader) {
      compHeader = parseCSVLine(line);
      continue;
    }
    totalComp++;
    const row = parseCSVLine(line);
    if (row[3]?.toUpperCase().includes('YADUVEER') || row[4]?.toUpperCase() === 'MYSORE' || row[4]?.toUpperCase() === 'MYSURU') {
      mysoreComp.push(row);
    }
  }
  console.log('Total completed works counted:', totalComp);
  console.log('Mysore completed works counted:', mysoreComp.length);
  if (mysoreComp[0]) {
    console.log('Sample Mysore comp work:', mysoreComp[0]);
  }
}

run();
