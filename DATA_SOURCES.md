# Official MPLADS Data Sources & Documentation

This document explains where the data in this platform comes from, how it is organized, and how anyone can independently verify every figure directly from public Government of India portals.

---

## 1. Where Does the Data Come From?

All data in this system is sourced directly from the official, publicly available **Members of Parliament Local Area Development Scheme (MPLADS)** portal operated by the **Ministry of Statistics and Programme Implementation (MoSPI), Government of India**:

* **Official Portal**: [https://mplads.gov.in](https://mplads.gov.in)
* **Publishing Ministry**: Ministry of Statistics and Programme Implementation (MoSPI)
* **Governing Rulebook**: Revised MPLADS Guidelines (February 2023)
* **Data Snapshot Date**: September 02, 2026

No synthetic, mock, or imaginary project records are used for national analytics. Every national total, MP name, constituency, and work ID corresponds to public records published by the Government of India.

---

## 2. Ingested Dataset Files

The platform includes four master data files stored in the `dataset/` directory:

| File Name | File Size | Description | Official Source |
| :--- | :--- | :--- | :--- |
| `mplads_mp_summary_2026-09-02.csv` | 98.9 KB | Master directory of all 774 Members of Parliament (543 Lok Sabha + 231 Rajya Sabha), their allocated amounts, expenditures, utilization percentages, and completed works count. | [mplads.gov.in/mp-summary](https://mplads.gov.in) |
| `mplads_completed_works_2026-09-02.csv` | 11.67 MB | Complete list of 43,899 works physically certified as completed across all 36 States and Union Territories. | [mplads.gov.in/works](https://mplads.gov.in) |
| `mplads_recommended_works_2026-09-02.csv` | 22.91 MB | List of 86,982 public works recommended by MPs, tracking their progress, sanction stages, and implementing agencies. | [mplads.gov.in/works](https://mplads.gov.in) |
| `mplads_expenditures_2026-09-02.csv` | 26.30 MB | Detailed record of 108,362 public transactions showing exact tranche disbursements from district accounts to implementing agencies. | [mplads.gov.in/expenditures](https://mplads.gov.in) |
| `json_2026-09-02.json` | 520 Bytes | Verified national macroeconomic summary totals matching MoSPI quarterly releases. | MoSPI Open Data |

---

## 3. Verified National Benchmarks

The figures displayed on the platform overview match the published MoSPI portal numbers:

* **Total Capital Allocated**: ₹ 11,681,90,35,627.53 (₹ 11,681.90 Crore)
* **Total Expenditure Released**: ₹ 3,984,76,55,097.14 (₹ 3,984.77 Crore)
* **National Utilization Velocity**: 34.11%
* **Total Members of Parliament**: 774 MPs (543 Lok Sabha, 231 Rajya Sabha)
* **Geographic Coverage**: 100% (36 States and Union Territories)
* **Total Public Works Recommended**: 86,982 projects
* **Total Public Works Completed**: 43,899 projects (50.47% completion rate)
* **Total Verified Transactions**: 108,362 financial records

---

## 4. Understanding the 5 Roles in Simple English

The MPLADS process involves five distinct levels of responsibility. This platform gives each level its own dedicated workspace:

### 1. Member of Parliament (MP)
* **Who they are**: An elected Member of Lok Sabha (representing a constituency) or Rajya Sabha (representing a State).
* **Their annual entitlement**: Each MP is entitled to recommend works worth ₹ 5.00 Crore per financial year for community assets (drinking water, school classrooms, public health centers, village roads, community halls).
* **What they do on MARGA**: Propose projects, check whether their recommendations have been sanctioned by the District Collector, and monitor photographic proof from the ground.

### 2. District Authority (DA)
* **Who they are**: The District Magistrate (DM), Deputy Commissioner (DC), or District Collector.
* **Their legal responsibility**: Under Section 4 of the 2023 Guidelines, the District Authority is the administrative head who examines whether a recommended work is technically feasible, verifies cost estimates, and officially issues the **Administrative Sanction (AS)** and **Technical Sanction (TS)**.
* **What they do on MARGA**: Screen projects against the 2023 Prohibited Items List (such as private property or commercial works), appoint government executing agencies, release fund tranches, and conduct the **mandatory 10% annual field inspections**.

### 3. Implementing Agency (IA)
* **Who they are**: Government engineering units such as Public Works Department (PWD), Central PWD (CPWD), Panchayati Raj Engineering Division, or Municipal Corporations.
* **Their responsibility**: Physically build the asset on the ground, ensure structural quality, and record progress in government Measurement Books (MB).
* **What they do on MARGA**: Take real-time GPS geotagged photographs before, during, and after construction, and file the statutory **30-day inspection reports** by the 10th of every calendar month.

### 4. State Nodal Department (State)
* **Who they are**: The Planning Department or Rural Development Department of the respective State Government.
* **Their responsibility**: Monitor the scheme across all districts within the state, ensure unspent funds do not lapse, and submit consolidated reports to the central ministry.
* **What they do on MARGA**: Compare district performance, track utilization speeds, and assist districts that are lagging behind.

### 5. Ministry of Statistics and Programme Implementation (MoSPI)
* **Who they are**: The central Ministry of the Government of India in New Delhi responsible for policy, fund releases to district nodal accounts, and national scheme evaluation.
* **What they do on MARGA**: Track macro-level fund utilization across India, enforce guideline adherence, and conduct **1% automated random audits** on completed assets.

---

## 5. Statutory Rules Checked Automatically

The system implements rule checks based on the **Revised MPLADS Guidelines (2023)** issued by MoSPI:

1. **Annexure-II Prohibited Works Screening**: The platform screens every proposal to ensure it does not fund prohibited items, such as:
   * Private religious buildings or religious trusts
   * Commercial or residential buildings for individuals
   * Land purchase or land acquisition costs
   * Grants or loans to private entities
   * Memorials, statues, or naming plaques violating clause 3.12
2. **Disbursement-Progress Mismatch Rule**: Detects projects where financial disbursements significantly outpace certified physical work on the ground (e.g. 90% funds released with only 30% physical execution).
3. **Statutory 10% Inspection Rule**: Tracks whether the District Authority has inspected at least 10% of all ongoing and completed works each year.
4. **Periodic 30-Day Reporting**: Tracks whether executing agencies submit their milestone and photographic inspection reports every 30 days.

---

## 6. How to Independently Verify Any Record

1. Open [https://mplads.gov.in](https://mplads.gov.in) in your browser.
2. Navigate to **Reports -> Work-wise Report** or **MP-wise Summary Report**.
3. Search for any Member of Parliament (e.g., "Dr. Arvind Patil" or "Shri Arun Kumar Sagar") or any Work ID (e.g., "1042" or "134703").
4. Compare the sanctioned budget, location, and progress with the data displayed on this platform.
