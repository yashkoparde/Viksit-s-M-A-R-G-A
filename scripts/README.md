# MARGA Data Processing & Generation Scripts

> **Path**: `scripts/`  
> **Environment**: Node.js (CommonJS)

This directory contains utility scripts for offline statistical analysis, dataset inspection, and synthetic stress-testing datasets for the **MARGA platform**.

---

## 🛠️ Utility Catalog

### 1. `scripts/analyzeDataset.js`
* **Purpose**: Performs high-speed stream-based statistical analysis on the verified CSV datasets in `dataset/`.
* **Execution**:
  ```bash
  node scripts/analyzeDataset.js
  ```
* **Output**:
  * Total MP count verification (774 MPs across 36 States/UTs).
  * State-level aggregate allocations and expenditures.
  * Active works pipeline count (88,604 recommended works).
  * Certified asset count (45,679 completed works).
  * Sample constituency record extraction for verification.

### 2. `scripts/generateRealDataset.js`
* **Purpose**: Generates realistic, fully populated seed data files, reconciling MP portfolios, realistic contractor expenditure timelines, and verified GPS coordinates for testing.
* **Execution**:
  ```bash
  node scripts/generateRealDataset.js
  ```

---

## 📌 Active Database Scripts (`src/scripts/`)

For seeding the live MongoDB Atlas cluster or running database imports, use the primary project scripts configured in `package.json`:
* `npm run seed`: Executes `node src/scripts/seedData.js`.
* `npm run import-data`: Executes `node src/scripts/importOfficialData.js`.
