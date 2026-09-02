# MARGA Verified Government Datasets

> **Path**: `dataset/`  
> **Source**: Ministry of Statistics and Programme Implementation (MoSPI) · Government of India  
> **Portal**: [mplads.gov.in](https://mplads.gov.in) · Snapshot Date: September 2, 2026

This directory contains the verified national baseline datasets powering the **MARGA Platform**. These files provide ground truth for all 774 Members of Parliament, 36 States/UTs, and over 130,000 public works projects.

---

## 📁 Dataset Catalog

| File Name | Size | Records | Description |
| :--- | :--- | :--- | :--- |
| **`mplads_mp_summary_2026-09-02.csv`** | 98.8 KB | 774 MPs | Portfolio summary for all Lok Sabha (543) and Rajya Sabha (231) MPs: cumulative allocations, expenditures, completion rates, unspent balances, and transaction counts. |
| **`mplads_completed_works_2026-09-02.csv`** | 11.6 MB | 45,679 Works | Canonical register of certified completed works with completion dates, final executed amounts, category tags, and implementing agencies. |
| **`mplads_recommended_works_2026-09-02.csv`** | 22.9 MB | 88,604 Works | Active works pipeline including newly recommended, administratively sanctioned, and in-progress infrastructure projects. |
| **`mplads_expenditures_2026-09-02.csv`** | 26.3 MB | 108,362 Items | Itemized milestone disbursements and expenditure ledger entries linked to contractor measurement book entries. |
| **`json_2026-09-02.json`** | 520 B | 1 Schema | Metadata manifest recording ingestion timestamps, checksums, and schema versions. |

---

## 🏛️ Official Schema Fields

### MP Summary Schema (`mplads_mp_summary_2026-09-02.csv`)
* `MP Name`: Sponsoring Representative.
* `Constituency`: Parliamentary constituency name.
* `State`: State / Union Territory.
* `House`: `Lok Sabha` or `Rajya Sabha`.
* `Allocated Amount (₹)`: Total funds released under the ₹5.00 Cr annual entitlement.
* `Total Expenditure (₹)`: Certified utilized funds.
* `Utilization %`: Expenditure divided by total allocation.
* `Completed Works`: Count of certified completed community assets.
* `Recommended Works`: Count of pending or active projects.
* `Unspent Amount (₹)`: Non-lapsable balance available for fresh recommendations.

---

## 🔄 Data Pipeline & Ingestion

The datasets are automatically parsed and indexed at server boot by:
* `src/utils/datasetLoader.js`: Ingests CSVs into in-memory indices for ultra-fast REST responses.
* `src/scripts/seedData.js`: Seeds records into MongoDB Atlas (`mplads_db`).
* `src/scripts/importOfficialData.js`: Batch importer utility.
