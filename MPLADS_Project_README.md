# MPLADS Monitoring & Analytics Platform

## Project Overview

We are building a web-based **MPLADS monitoring and analytics platform** for monitoring development works recommended under the **Members of Parliament Local Area Development Scheme (MPLADS)**.

The platform combines:

1. Official MPLADS government data
2. MP-wise and state-wise analytics
3. Work-level monitoring
4. District Authority (DA) verification
5. Implementing Agency (IA) inspections
6. Geotagged photographs
7. 30-day inspection reports
8. Nodal Authority verification
9. MoSPI-level monitoring
10. Financial and work-progress analytics
11. Comparison of MPs/states/works through graphs
12. Search by Work ID to see the complete history of a work

The project is intended to work across **different departments**.

---

# 1. Main Workflow

```text
MP
 │
 │ 1. Recommends Work
 ▼
District Authority (DA)
 │
 │ 2. Checks:
 │    • Feasibility
 │    • Time required
 │    • Whether the work is prohibited
 ▼
Implementing Agency (IA)
 │
 │ 3. Visits workplace
 │
 │ 4. Inspects the work
 │
 │ 5. Captures geotagged photographs
 │
 │ 6. Creates report every 30 days
 │
 │ 7. Report submitted on 10th of every month
 ▼
Monitoring
 │
 ├── MP → monitors their portfolio
 │
 ├── Nodal Authority → checks 1% of repeated work
 │
 └── MoSPI → monitors/overviews every work
```

The broader MPLADS lifecycle represented in the project is:

```text
MP Work Recommendation
        ↓
Eligibility & Guideline Check
        ↓
Technical / Site / Cost Examination
        ↓
Administrative Sanction
        ↓
Implementing Agency
        ↓
Work Execution
        ↓
Expenditure / Disbursement
        ↓
Work Completion
        ↓
Completion Record
```

The platform adds a stronger **inspection, evidence, geotagging, reporting, and monitoring layer** to this lifecycle.

---

# 2. Roles

## MP

The MP should have a portfolio showing:

- MP details
- Constituency/state
- Recommended works
- Work status
- Funds
- Utilization
- Completed works
- Pending works
- Work progress
- Overall portfolio

The MP primarily recommends works and monitors the works in their portfolio.

## District Authority (DA)

The DA checks the recommendation before it proceeds.

The DA checks:

- Whether the work is feasible
- Estimated time required
- Site/technical feasibility
- Whether the work is prohibited
- Other required eligibility/guideline conditions

## Implementing Agency (IA)

The IA handles field-level implementation and monitoring.

The IA:

- Visits the workplace
- Inspects the work
- Captures photographs
- Uses the geotagged camera
- Records GPS location
- Records date/time
- Records physical progress
- Creates an inspection report every 30 days
- Submits the report on the 10th of every month

## Nodal Authority

The Nodal Authority has a verification role.

Current project requirement:

> Nodal Authority checks 1% of repeated work.

The database should track selected/repeated works that require this verification.

## MoSPI

MoSPI provides the overall monitoring/overview layer.

It should be able to see:

- Works
- Financial information
- Work progress
- Inspections
- Reports
- Photos/evidence
- Alerts/anomalies
- State/MP performance
- Overall project status

---

# 3. Central Entity — Work ID

The most important identifier in the system is the:

```text
WORK ID
```

Everything related to a work should connect to its Work ID.

Example:

```text
WORK ID: MPLADS/2026/00125
       │
       ├── MP recommendation
       ├── DA review
       ├── IA
       ├── Financial information
       ├── Work status
       ├── Inspection 1
       │     ├── Photos
       │     └── Report
       ├── Inspection 2
       │     ├── Photos
       │     └── Report
       ├── Inspection 3
       │     ├── Photos
       │     └── Report
       ├── Nodal verification
       └── MoSPI monitoring
```

### Required behavior

If a user searches for a **Work ID**, the website should show the complete details and history of that work.

---

# 4. Website Dashboard

The website will contain an analytics/dashboard layer similar to the provided UI design.

## MP Utilization Dashboard

Key metrics:

```text
TOTAL MPs
TOTAL ALLOCATED
TOTAL UTILIZED
AVG. UTILIZATION
WORKS COMPLETED
```

MPs should be classified into:

```text
High Performers
Average Performers
Needs Improvement
```

The dashboard should support:

- Search MP
- Search constituency
- Search state
- Filter by utilization
- Filter by Lok Sabha/Rajya Sabha
- Sort by fund utilization
- Grid/List view
- Export data/report

---

# 5. State-wise Dashboard

The platform should provide state-wise MPLADS performance for all states and Union Territories.

Each state/UT should show:

```text
State / UT
Number of MPs
Allocated
Utilized
Utilization %
Works Completed
Works Pending
Ranking
```

Example:

```text
Maharashtra
    MPs: XX
    Allocated: ₹XXX Cr
    Utilized: ₹XXX Cr
    Utilization: XX%
    Works completed: XXXX
```

State dashboard features:

- Search states/UTs
- Filter by performance
- Sort by utilization %
- Grid/List view
- View details
- Download report

---

# 6. Compare Feature

The website should include a **Compare** feature.

## MP vs MP

```text
MP A
vs
MP B
```

## State vs State

```text
Maharashtra
vs
Karnataka
vs
Gujarat
```

## Work/Category Comparisons

Potential comparisons include:

```text
Education works
vs
Healthcare works
vs
Infrastructure works
```

The exact comparison options can be expanded later.

---

# 7. Graphical Comparison

The comparison feature should show results graphically, not only as tables.

Example:

```text
Utilization %

Maharashtra ███████████████ 72%
Karnataka   ████████████    61%
Gujarat     ██████████████  69%
```

Possible graphs:

- Bar chart
- Grouped bar chart
- Line chart
- Pie/donut chart
- Performance comparison
- Utilization trend
- Work completion comparison

### Architecture

```text
MongoDB
   ↓
Aggregation / Query
   ↓
Backend API
   ↓
JSON
   ↓
Frontend
   ↓
Graph
```

MongoDB stores and aggregates the data. The frontend/chart library displays the graph.

---

# 8. Official MPLADS Dataset

A major part of the project is adding data from the **official Government MPLADS website**.

The official data will form the foundation of the analytics dashboards.

Potential information includes:

- MPs
- States / UTs
- Constituencies
- Allocated funds
- Utilized funds
- Utilization %
- Works
- Completed works
- Pending works
- Expenditure
- Sectors/categories
- Districts
- Blocks
- Villages
- Work status
- Financial years
- Lok Sabha/Rajya Sabha information

## Dataset workflow

```text
Official MPLADS Website
        ↓
Identify required datasets
        ↓
Download/export available data
        ↓
CSV / Excel / other format
        ↓
Inspect data
        ↓
Clean data
        ↓
Normalize fields
        ↓
Validate Work IDs
        ↓
Import into MongoDB
        ↓
Create indexes
        ↓
Build APIs
        ↓
Display on website
```

### Important

Do **not** import the dataset blindly.

The actual official dataset must first be inspected to determine:

- What columns exist
- What identifiers exist
- How Work IDs are represented
- Which fields are available
- Which fields are missing
- Which datasets can be joined
- Which values need normalization

The project PDF identifies several useful fields but also states that the data dictionary must be validated against the actual bulk export.

---

# 9. Dataset Cleaning

Before inserting data into MongoDB, clean and normalize the dataset.

## Example: Status normalization

Different values such as:

```text
Completed
COMPLETED
complete
Complete
```

should become:

```text
COMPLETED
```

## Data quality checks

Check for:

- Duplicate Work IDs
- Missing Work IDs
- Invalid amounts
- Different date formats
- Missing MP information
- Missing location information
- Duplicate works
- Invalid state names
- Different spellings
- Missing completion dates
- Missing payment dates

---

# 10. Proposed MongoDB Collections

The exact schema should be finalized **after inspecting the actual official dataset**.

## `mps`

Stores MP information.

```text
mpId
name
house
state
constituency
term
oathDate
```

## `states`

Stores state/UT information.

```text
stateId
name
type
```

## `works`

**Most important collection.**

```text
workId
mpId
state
district
constituency
department
description
category
recommendedAmount
sanctionedAmount
disbursedAmount
status
physicalProgress
sanctionDate
anticipatedCompletionDate
actualCompletionDate
location
```

The final fields will be based on the actual official data.

## `da_reviews`

Stores District Authority checks.

```text
workId
feasible
estimatedTime
prohibited
remarks
reviewedBy
reviewedAt
```

## `inspections`

Stores IA inspections.

```text
inspectionId
workId
iaId
inspectionDate
progressPercentage
remarks
reportId
submittedAt
```

## `photos`

Stores geotagged camera information.

```text
photoId
workId
inspectionId
imageReference
latitude
longitude
capturedAt
metadata
```

The actual image can be stored using the selected image/file storage architecture, while MongoDB stores the reference and metadata.

## `reports`

Stores 30-day inspection reports.

```text
reportId
workId
inspectionId
reportingPeriod
reportDate
submittedDate
documentReference
```

## `payments`

Stores financial/payment information.

```text
workId
amount
paymentDate
reference
```

## `monitoring`

Stores higher-level monitoring.

```text
workId
nodalVerification
mospiReview
flags
remarks
```

---

# 11. Geotagged Camera Integration

The geotagged camera has already been built.

The intended workflow is:

```text
IA opens camera
       ↓
Captures photo
       ↓
GPS coordinates obtained
       ↓
Timestamp obtained
       ↓
Work ID attached
       ↓
Photo uploaded
       ↓
Photo metadata stored
```

Example:

```json
{
  "workId": "MPLADS/2026/00125",
  "location": {
    "latitude": 18.5204,
    "longitude": 73.8567
  },
  "capturedAt": "...",
  "imageReference": "..."
}
```

The critical connection is:

```text
workId
```

This connects the photograph to the actual MPLADS work.

---

# 12. 30-Day Inspection System

For every active work:

```text
Work starts
     ↓
30 days
     ↓
IA inspection
     ↓
Photos
     ↓
Progress
     ↓
Report
     ↓
Submit on 10th
     ↓
Next monitoring cycle
```

A work can therefore contain multiple inspection cycles:

```text
Work ID
│
├── Inspection 1
│    ├── Photos
│    └── Report
│
├── Inspection 2
│    ├── Photos
│    └── Report
│
├── Inspection 3
│    ├── Photos
│    └── Report
│
└── Completion
```

This provides a historical timeline rather than only the current status.

---

# 13. Work Details Page

When someone searches:

```text
WORK-2026-00125
```

the website should show:

## Basic Details

```text
Work ID
MP
State
Constituency
District
Department
Category
Description
```

## Financial

```text
Recommended Amount
Sanctioned Amount
Disbursed Amount
Utilization
```

## DA Review

```text
Feasible
Estimated Time
Prohibited
DA Remarks
```

## Progress

```text
Current Status
Physical Progress
Expected Completion
Actual Completion
```

## Inspection

```text
Inspection history
Reports
Photos
GPS locations
```

## Monitoring

```text
Nodal verification
MoSPI monitoring
Alerts
Anomalies
```

---

# 14. Financial Analytics

The financial flow should represent:

```text
Recommended Amount
        ↓
Sanctioned Amount
        ↓
Disbursed Amount
```

A core metric can be:

```text
Disbursement Rate =
Cumulative Disbursed
-------------------- × 100
Sanctioned Amount
```

This can be used for:

- MP dashboards
- State dashboards
- Work dashboards
- Comparisons
- Alerts
- Analytics

---

# 15. Advanced Analytics

The platform can eventually support:

## Delay Detection

Use:

```text
Sanction Date
+
Anticipated Completion Date
+
Actual Completion Date
+
Status
```

## Cost Anomaly

Compare:

```text
Recommended Amount
vs
Sanctioned Amount
vs
Disbursed Amount
```

## Duplicate Work Detection

Use:

```text
Work Description
+
Location
+
Date proximity
```

Stronger detection can later use text similarity/NLP.

## Progress vs Expenditure

Compare:

```text
Physical Progress %
vs
Cumulative Disbursed
```

## Payment Anomaly

Use:

```text
Cumulative Disbursed
+
Sanctioned Amount
+
Payment Date
+
Disbursement Rate
```

## Allocation Warning

Use:

```text
Allocated Amount
+
Term/Oath Date
+
Years Since Oath
```

---

# 16. Additional Analytics Ideas

Potential future analytics include:

- Trust/Society cap compliance
- Category-relative cost benchmarking
- Rajya Sabha vs Lok Sabha geographic concentration
- Fiscal-year-end expenditure clustering
- Status normalization
- Geographic inconsistency detection
- Financial reconciliation
- Work delay detection
- Risk/anomaly flags

These should be added only after the basic data pipeline is stable.

---

# 17. MongoDB Indexing

Important indexes will likely include:

## Work ID

```javascript
db.works.createIndex(
  { workId: 1 },
  { unique: true }
)
```

## Photos by Work ID

```javascript
db.photos.createIndex({
  workId: 1
})
```

## Geospatial Index

If photo location is stored as GeoJSON:

```javascript
db.photos.createIndex({
  location: "2dsphere"
})
```

This allows geographical queries.

Additional indexes should be decided after examining the actual query patterns.

---

# 18. Overall Architecture

```text
                 OFFICIAL MPLADS DATA
                         │
                         ▼
                  Data Cleaning
                         │
                         ▼
                    MongoDB Atlas
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
       MPs             States           Works
                                          │
                    ┌─────────────────────┼───────────────────┐
                    │                     │                   │
                    ▼                     ▼                   ▼
                 DA Review              IA              Financial
                                          │
                                    ┌─────┴─────┐
                                    ▼           ▼
                                Photos       Reports
                                    │
                                    ▼
                              GPS + Timestamp
                                    │
                                    ▼
                              Monitoring
                                    │
                    ┌───────────────┼──────────────┐
                    ▼               ▼              ▼
                   MP             Nodal           MoSPI
                                Authority
```

Application flow:

```text
MongoDB
   ↓
Backend APIs
   ↓
Website
   ↓
Dashboard / Search / Compare / Maps / Graphs
```

---

# 19. MongoDB Developer Responsibilities

## Phase 1 — Dataset

**First priority**

```text
Find official MPLADS datasets
        ↓
Download them
        ↓
Inspect files
        ↓
Understand columns
        ↓
Check data quality
```

## Phase 2 — Data Modeling

```text
Identify entities
        ↓
Design collections
        ↓
Define relationships
        ↓
Define document structure
```

## Phase 3 — MongoDB

```text
Create MongoDB Atlas
        ↓
Create database
        ↓
Create collections
        ↓
Create indexes
        ↓
Import cleaned dataset
```

## Phase 4 — Camera

```text
Camera
   ↓
Work ID
   ↓
GPS
   ↓
Timestamp
   ↓
Image
   ↓
MongoDB photo metadata
```

## Phase 5 — Backend

```text
API
 ↓
Search Work ID
 ↓
Retrieve work
 ↓
Retrieve photos
 ↓
Retrieve reports
 ↓
Retrieve financial information
```

## Phase 6 — Analytics

```text
MongoDB Aggregation
       ↓
MP statistics
       ↓
State statistics
       ↓
Utilization
       ↓
Comparison
       ↓
Graphs
```

---

# 20. Immediate Next Steps

Do not finalize the MongoDB schema before inspecting the real official data.

Follow this order:

```text
1. Find official MPLADS datasets
             ↓
2. Download them
             ↓
3. Inspect the CSV/Excel files
             ↓
4. Identify all available columns
             ↓
5. Identify Work ID relationships
             ↓
6. Identify which datasets can be joined
             ↓
7. Clean and normalize the data
             ↓
8. Design the final MongoDB schema
             ↓
9. Import data into MongoDB Atlas
             ↓
10. Create indexes
             ↓
11. Build aggregation queries
             ↓
12. Build backend APIs
             ↓
13. Connect the geotagged camera
             ↓
14. Connect the website
             ↓
15. Implement dashboards and comparison graphs
```

---

# 21. Key Design Principle

The system has **two major data layers**:

```text
                MPLADS PLATFORM
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
 OFFICIAL MPLADS DATA      NEW MONITORING DATA
          │                       │
          │                       ├── DA Reviews
          │                       ├── IA Inspections
          │                       ├── Geotagged Photos
          │                       ├── 30-Day Reports
          │                       ├── Nodal Verification
          │                       └── MoSPI Monitoring
          │
          ├── MPs
          ├── States
          ├── Funds
          ├── Works
          ├── Expenditure
          └── Work Status
```

The **official dataset** powers the existing analytics/dashboard layer.

The **new monitoring data** adds real-time/field-level evidence and work tracking.

The **Work ID** connects these two layers.

---

# 22. Important Data Validation Rule

Do not assume that every field required by the proposed platform already exists in the official MPLADS bulk dataset.

The actual dataset must be inspected first.

For example, fields related to:

- Contractor/vendor information
- Geotagged photographs
- Inspection records
- Reports
- Some monitoring information

may need to come from our **new platform**, rather than the official bulk dataset.

Therefore:

> **Official MPLADS data is the source of truth for the government-provided fields, while the application's own inspection, photo, report, and monitoring records are stored as new platform data.**

---

# 23. Final Goal

The final platform should allow a user to go from a **high-level national/state/MP dashboard** all the way down to an individual **Work ID**.

```text
National Overview
      ↓
State
      ↓
MP
      ↓
Constituency
      ↓
Work
      ↓
Inspection
      ↓
Geotagged Photo
      ↓
Report
```

This creates a complete chain from **fund utilization and performance analytics** to **physical work verification and evidence**.

---

## Current Priority

### START HERE:

**Obtain the official MPLADS dataset(s).**

Once the CSV/Excel data is available:

1. Inspect every column.
2. Understand the identifiers.
3. Find the Work ID.
4. Determine relationships between MP, state, district and work.
5. Clean the data.
6. Design the MongoDB schema from the real data.
7. Import it into MongoDB Atlas.
8. Build the APIs and aggregations required by the website.

**Do not guess the schema before seeing the actual dataset.**
