# MARGA — Comprehensive Technology Stack & Architectural Specification

> **Platform**: MARGA (MPLADS Analytics, Reporting & Geotagged Auditing Platform)  
> **Target Authority**: Ministry of Statistics and Programme Implementation (MoSPI), Government of India  
> **System Classification**: Statutory Multi-Stakeholder Governance, Financial Tracking & Geotagged Verification Engine  
> **Active Environment**: Full Stack (Node.js / Express / React 19 / TypeScript / MongoDB Atlas Cloud Cluster)

---

## 1. Executive Architectural Overview

MARGA is a unified digital operating system engineered to eliminate information asymmetry, fund idle float, and inspection gaps across the entire lifecycle of the **Member of Parliament Local Area Development Scheme (MPLADS)**. 

The architecture bridges central ministry oversight (MoSPI) down to field-level civil work verification (Implementing Agencies) through a synchronous, multi-tier data pipeline backed by a **130,000+ record live MongoDB Atlas cluster**, real-time statutory rule engines, EXIF geotag inspection validators, and automated risk scoring.

```mermaid
flowchart TD
    subgraph Client_Layer["Frontend Client Tier"]
        UI_SPA["React 19 + TypeScript SPA\n(Vite 6 + Tailwind CSS v4)"]
        UI_VANILLA["Vanilla Civic Web Portal\n(Canvas Scrollytelling + ES6)"]
        ROLES["5 Statutory Portals:\nMP | DA | IA | STATE | MOSPI"]
    end

    subgraph API_Gateway["Application & API Tier (Node.js + Express)"]
        EXP["Express REST API (Port 5000)"]
        AUTH["Role Profile & Session Controller"]
        ROUTES["API Routes:\n/works | /mps | /states | /da-reviews\n/inspections | /photos | /analytics | /db-status"]
        ENGINES["Governance Engines:\nRisk Scoring Engine\nEXIF Geotag Parser\nGuideline 2023 Rule Validator"]
    end

    subgraph Data_Tier["Hybrid Multi-Tier Data Storage"]
        ATLAS[("MongoDB Atlas Cloud Cluster0\nmplads_db\n(130,881 Works | 774 MPs | 76k Tx)")]
        DISK[("Persistent Disk JSON Store\ndata/marga_database.json\n(Air-gap fallback)")]
        LOCAL[("Browser LocalStorage Cache\nmarga_database_v4")]
        UPLOADS[("Local File Storage\n/uploads/photos (Geotagged Evidence)")]
    end

    subgraph AI_Tier["Intelligence & Analytics Tier"]
        GEMINI["Google Gemini Generative AI\n(@google/genai)"]
        DATASET_CSV["Official MoSPI Datasets\nCompleted, Recommended, Expenditures CSVs"]
    end

    Client_Layer <-->|HTTP / REST / JSON| API_Gateway
    API_Gateway <-->|Mongoose 8 ODM + SRV DNS| ATLAS
    API_Gateway <-->|fs Persistent Sync| DISK
    API_Gateway <-->|Multer + Exifr| UPLOADS
    API_Gateway <-->|CSV Parser + Stream Pipeline| DATASET_CSV
    API_Gateway <-->|GenAI API| GEMINI
    UI_SPA <-->|Sync Cache| LOCAL
```

---

## 2. Technology Stack Matrix

| Tier | Component / Tool | Version | Purpose & Implementation Details |
| :--- | :--- | :--- | :--- |
| **Runtime** | **Node.js** | `>=18.x / 20.x` | High-performance asynchronous JavaScript runtime for API services and streaming data pipelines. |
| **Language** | **TypeScript** | `~5.8.2` | Strong type definitions, interfaces for Works, MPs, Recommendations, Inspections, and Role permissions. |
| **Language** | **JavaScript (ES2022+)** | Native | CommonJS module backend and modern ES Modules frontend scripts. |
| **Frontend Framework** | **React** | `19.0.1` | Component-based UI library powering dynamic state management across 5 statutory dashboards. |
| **DOM Renderer** | **React DOM** | `19.0.1` | Client-side DOM rendering for SPA views, modals, and evidence drawers. |
| **Build & Bundler** | **Vite** | `6.2.3` | Ultra-fast development server with Hot Module Replacement (HMR) and optimized Rollup production builds. |
| **CSS Architecture** | **Tailwind CSS v4** | `4.1.14` | Modern utility-first CSS framework via `@tailwindcss/vite` for institutional governance styling. |
| **Icons & Symbols** | **Lucide React** | `0.546.0` | Comprehensive civic and technical icon system for status, audit, evidence, and risk indicators. |
| **Micro-Animations** | **Motion (Framer Motion)** | `12.23.24` | Fluid UI animations, layout transitions, and interactive drawer physics. |
| **Backend Framework** | **Express.js** | `4.21.2` | Minimalist web application framework for RESTful routing, static file serving, and middleware orchestration. |
| **Primary Database** | **MongoDB Atlas** | Cloud `v7.x` | Production cloud NoSQL database cluster (`Cluster0`) storing 130,881 works, 774 MPs, and audit ledgers. |
| **ODM / Client** | **Mongoose** | `8.9.5` | Schema validation, Decimal128 handling, lean query execution, and index optimization. |
| **DNS Resolution** | **Node.js `dns` module** | Native | Explicit fallback to `8.8.8.8` and `1.1.1.1` to ensure reliable Atlas SRV resolution (`mongodb+srv`). |
| **Local Persistence** | **Disk JSON Engine** | Custom | File-backed JSON document store (`data/marga_database.json`) for uninterrupted offline demo operations. |
| **File Uploads** | **Multer** | `1.4.5-lts.1` | Multipart form-data parser handling field camera photos and milestone documentation uploads. |
| **Metadata Extraction**| **Exifr** | `7.1.3` | High-speed binary parser extracting EXIF GPS coordinates (`latitude`, `longitude`) and timestamps. |
| **Spreadsheet Engine** | **SheetJS (xlsx)** | `0.18.5` | In-memory parser for official government Excel files (`.xlsx`, `.xls`). |
| **CSV Streaming** | **csv-parser** | `3.2.0` | Node.js stream-based CSV parsing for multi-megabyte completed and recommended works datasets. |
| **AI / Semantic Engine**| **Google GenAI** | `2.4.0` | `@google/genai` integration for the "Ask MARGA" statutory query and policy compliance assistant. |
| **Tunneling / Remote** | **Cloudflared / Localtunnel**| CLI | Public HTTPS tunneling (`npm run tunnel`) for field audits, mobile inspections, and live presentations. |
| **Process Management** | **Nodemon** | `3.1.9` | Auto-restart development server monitoring file updates in `src/`. |
| **Multi-Process Runner**| **Concurrently** | `9.2.4` | Parallel execution of backend server, frontend watchers, and remote public tunnels. |

---

## 3. Database Architecture & Data Collections

The primary cloud database is hosted on **MongoDB Atlas** under cluster `Cluster0` and database **`mplads_db`**.

### 3.1 MongoDB Atlas Collections

| Collection Name | Document Count | Purpose / Description |
| :--- | :--- | :--- |
| **`works`** | **130,881** | Authoritative ledger of all national completed, ongoing, and recommended MPLADS projects. |
| **`mps`** | **774** | Complete portfolio records of every sitting Lok Sabha and Rajya Sabha Member of Parliament. |
| **`work_sanctions`** | **15,000** | Administrative and technical sanction records with sanctioned cost and implementing district. |
| **`expenditures`** | **76,064** | Milestone disbursement and financial voucher transactions issued by District Authorities. |
| **`da_reviews`** | **10+** (Dynamic) | District Authority feasibility determinations, 2023 guideline compliance checks, and remarks. |
| **`ia_inspections`** | **10+** (Dynamic) | 30-Day physical progress audit logs and civil milestone verifications submitted by field engineers. |
| **`geotagged_photos`** | **10+** (Dynamic) | Evidence repository with latitude/longitude coordinates, inspection IDs, and captured timestamps. |
| **`reports`** | **10+** (Dynamic) | Periodic Monthly Progress Reports (MPR) and quarterly audit dossiers for Nodal verification. |
| **`monitoring`** | **10+** (Dynamic) | Central MoSPI oversight flags, anomaly alerts, and statutory sampling records. |

### 3.2 Schema Specifications

#### Work Schema (`works`)
```typescript
interface WorkRecord {
  _id: ObjectId;
  workId: string;                     // e.g. "WORK-CMP-134703" or "MPLADS-134703"
  sourceWorkId?: string;              // Official MoSPI numeric ID (e.g. "134703")
  workDescription: string;            // Official title/description of the civil asset
  category: string;                   // "Infrastructure", "Drinking Water", "Education", etc.
  mpName: string;                     // Recommending Member of Parliament
  house: "Lok Sabha" | "Rajya Sabha"; // Parliamentary chamber
  constituency: string;               // Parliamentary constituency
  district: string;                   // Nodal implementation district
  state: string;                      // State or Union Territory
  ida: string;                        // Implementing District Authority office
  sanctionedAmount: Decimal128 | number; // Sanctioned financial cost in INR
  finalAmount: Decimal128 | number;      // Actual disbursed expenditure in INR
  status: string;                     // "COMPLETED" | "IN_PROGRESS" | "RECOMMENDED"
  physicalProgress: number;           // 0 to 100 percentage verified
  hasImages: boolean;                 // Geotagged evidence availability flag
  completedDate?: Date;               // Physical asset completion date
  sanctionDate?: Date;                // Administrative sanction date
}
```

#### MP Schema (`mps`)
```typescript
interface MPRecord {
  _id: ObjectId;
  mpName: string;                     // Name of the MP
  house: "Lok Sabha" | "Rajya Sabha"; // House affiliation
  constituency: string;               // Lok Sabha constituency or State for Rajya Sabha
  state: string;                      // State / Union Territory
  allocatedAmount: Decimal128 | number; // Total entitlement/allocated funds (INR)
  totalExpenditure: Decimal128 | number;// Total funds drawn/spent (INR)
  unspentAmount: Decimal128 | number;   // Balance available for recommendation
  utilizationPercentage: number;       // Expenditure to allocation ratio
  completedWorksCount: number;         // Count of finished works
  recommendedWorksCount: number;       // Count of works awaiting sanction/completion
  completionRatePercentage: number;    // Ratio of completed to recommended works
  transactionCount: number;            // Total financial vouchers tracked
}
```

#### Inspection & Geotag Schema (`ia_inspections` & `geotagged_photos`)
```typescript
interface InspectionRecord {
  _id: ObjectId;
  inspectionId: string;               // e.g. "INSP-WORK-CMP-134703"
  workId: string;                     // Linked Work ID
  iaId: string;                       // Executive Engineer / IA Field Officer ID
  inspectionDate: Date;               // Date of on-site verification
  progressPercentage: number;         // Physical milestone (0-100)
  remarks: string;                    // Field notes and stage certification
}

interface GeotaggedPhotoRecord {
  _id: ObjectId;
  photoId: string;                    // e.g. "PHOTO-WORK-CMP-134703-1"
  workId: string;                     // Linked Work ID
  inspectionId: string;               // Linked Inspection
  imageReference: string;             // URL or local upload path
  latitude: number;                   // GPS Latitude (-90 to +90)
  longitude: number;                  // GPS Longitude (-180 to +180)
  capturedAt: Date;                   // EXIF acquisition timestamp
}
```

---

## 4. Backend Architecture & REST API Surface

The Express backend (`src/server.js`) operates on port `5000` (or `process.env.PORT`) with high-concurrency middleware:
- **CORS enabled**: Cross-origin support for React dev server and mobile auditors.
- **JSON & URL-encoded body parser**: Parses up to multi-megabyte payloads.
- **Morgan logger**: `dev` profile HTTP request tracing.
- **Static Asset Serving**: Serves compiled Vite bundle (`dist/`), public static files (`public/`), image uploads (`uploads/`), and frame sequence assets (`sequence/`).

### API Endpoints Summary

```
========================================================================================
METHOD    ENDPOINT                       PURPOSE
========================================================================================
GET       /api/health                    Healthcheck, system uptime, and DB connection state
GET       /api/db-status                 Live MongoDB Atlas metrics, cluster host, and counts
GET       /api/works                     Paginated & filtered query across 130k+ works
GET       /api/works/:workId             Full dossier: work + financials + DA review + audits
POST      /api/works                     Create new work recommendation
GET       /api/mps                       List 774 MPs with utilization rates, tiers & search
GET       /api/mps/:mpId                 Single MP comprehensive portfolio & financial breakdown
GET       /api/states                    Rankings, allocations & utilization across 36 States/UTs
GET       /api/states/:stateId           Single State drilldown with constituency aggregation
POST      /api/da-reviews                DA statutory feasibility & prohibited check submission
GET       /api/da-reviews/:workId        Retrieve DA examination record for specific work
POST      /api/inspections               IA 30-day physical progress audit & milestone log
GET       /api/inspections/:workId       Inspection timeline for specific work
POST      /api/photos/upload             Upload & auto-extract EXIF GPS geotagged photo
GET       /api/photos/:workId            Retrieve geotagged evidence photos with coordinates
GET       /api/analytics/overview        Macroeconomic national overview (Sanctioned, Disbursed, %)
GET       /api/sequence-manifest         Scrollytelling frame manifest (480 WebP frames)
========================================================================================
```

---

## 5. Dual Frontend Architecture

MARGA implements a dual-interface strategy to serve both high-level public transparency and in-depth statutory administration:

### 5.1 Primary React 19 SPA (`src/`)
Built with Vite 6, TypeScript, Tailwind CSS v4, and Motion:
- **`App.tsx`**: Central stage controller managing three chronological application states:
  1. **Landing Stage**: Visual scrollytelling introduction (`LandingStorySequence.tsx`).
  2. **Auth Stage**: Statutory role credential verification with profile switching (`RoleLoginPage.tsx`).
  3. **Portal Stage**: Role-specific operating dashboard with universal drawers.
- **Universal Governance Modals & Drawers**:
  - `WorkDetailDrawer.tsx`: Multi-tab comprehensive work audit ledger (Financial flow, Milestone timeline, Photo evidence with GPS, DA review notes).
  - `RiskExplanationModal.tsx`: Algorithmic breakdown of risk scores and guideline compliance signals.
  - `AiAssistantDrawer.tsx`: "Ask MARGA" conversational intelligence for MPLADS Guideline 2023 queries.
  - `GlobalSearchModal.tsx`: Sub-second fuzzy search across Work IDs, MPs, and Districts.
  - `AuditLedgerModal.tsx`: Immutable chronological event log of all actions taken in the platform.
  - `ReportGeneratorModal.tsx`: Automated generator for Monthly Progress Reports (MPR) and MP constituency briefings.
  - `RolePermissionMatrixModal.tsx`: Interactive statutory guardrails and authority matrix per MoSPI rules.

### 5.2 5 Dedicated Statutory Role Portals

| Portal Component | Statutory Authority | Primary Capabilities & Workflows |
| :--- | :--- | :--- |
| **`MpPortal.tsx`** | **Hon'ble Member of Parliament** | Track ₹5 Cr annual entitlement, formulate new recommendations, review real-time DA sanction status, and monitor unspent balance. |
| **`DaPortal.tsx`** | **District Authority (DM / Collector)** | Statutory 45-day review timeline, technical feasibility checks, 2023 Prohibited Works validation, and administrative sanction issuance. |
| **`IaPortal.tsx`** | **Implementing Agency Field Engineer** | 30-day mandatory physical audit cycles, milestone progress logging (0-100%), and EXIF-validated geotagged photo uploads. |
| **`StatePortal.tsx`** | **State Nodal Department** | Inter-district performance comparison, 10% statutory field inspection tracking, and state-wide utilization monitoring. |
| **`MospiPortal.tsx`** | **Central Ministry HQ (New Delhi)** | Macroeconomic capital deployment oversight, national expenditure velocity analytics, and statutory 1% central audit sampling. |

### 5.3 Vanilla Scrollytelling Portal (`public/index.html`)
- Fixed canvas scrubbing 480 pre-rendered animation frames (`public/storySequence.js`).
- Zero-dependency Vanilla JS routing and live cluster metrics HUD.
- Responsive civic stylesheet (`public/style.css`) with Government of India tricolor styling.

---

## 6. Algorithmic Engines & Business Logic

### 6.1 Multi-Factor Risk Scoring Engine
Calculates project-level risk bands (`Low`, `Medium`, `High`, `Critical`) using weighted anomaly signals:

$$\text{Risk Score} = \sum_{i=1}^{n} w_i \cdot S_i$$

1. **Cost Z-Score Anomaly ($w=1.5$)**: Flags projects whose proposed budget deviates significantly from regional baseline costs for the same asset category.
2. **Duration Anomaly ($w=2.2$)**: Detects milestones stalled for $>60$ days without progress increments.
3. **Disbursement Mismatch Penalty ($w=1.8$)**: Flags financial expenditure draw (e.g. 82.9%) ahead of certified physical execution (e.g. 42.0%) per MPLADS 2023 Clause 4.6.
4. **Implementing Agency Concentration ($w=0.9$)**: Flags execution bottlenecks where a single local agency exceeds capacity thresholds.
5. **Evidence Gap ($w=1.8$)**: Penalizes projects lacking mandatory pre-construction ("Before Work") or milestone photos.

### 6.2 MPLADS 2023 Statutory Guidelines Compliance Engine
Automated eligibility checks based on the revised scheme handbook:
- **Prohibited Works Check**: Evaluates proposed assets against prohibited items (e.g. religious structures, commercial ventures, private lands).
- **Mandatory Earmarking**: Validates statutory 15% SC (Scheduled Caste) and 7.5% ST (Scheduled Tribe) area capital allocation per constituency.
- **Inspection Mandate**: Enforces statutory 10% District Authority inspection coverage and 1% Central Ministry audit sample generation.

### 6.3 EXIF Geotag Verification Pipeline
When field photos are uploaded via the IA Field Camera:
1. Multer intercepts the binary stream into `/uploads/photos/`.
2. `exifr` parses metadata looking for `GPSLatitude`, `GPSLongitude`, and `DateTimeOriginal`.
3. Coordinates are validated against district boundaries to prevent fraudulent off-site documentation.

---

## 7. Directory & File Structure

```
c:\Users\yashk\Downloads\marga\
├── .env                                # Production environment variables (MongoDB Atlas URI, DB, Port)
├── .env.example                        # Template environment configuration
├── DATA_SOURCES.md                     # Data lineage, provenance, and dataset documentation
├── MPLADS_Project_README.md            # Comprehensive project master specification
├── README.md                           # Hackathon orientation & quickstart guide
├── README_SETUP.md                     # Step-by-step installation and execution manual
├── techstack.md                        # Master technology stack & architectural specification
├── index.html                          # Vite entry HTML for React SPA
├── package.json                        # NPM package manifest & dependency graph
├── tsconfig.json                       # TypeScript compiler options & strictness configuration
├── vite.config.ts                      # Vite build configuration with React & Tailwind plugins
├── nodemon.json                        # Server file-watching rules
│
├── data/                               # Local persistent disk caches & fallback stores
│   └── marga_database.json             # File-backed JSON document store (Air-gapped mode)
│
├── dataset/                            # Official MoSPI Datasets (Raw data pipeline sources)
│   ├── json_2026-09-02.json            # National overview metrics snapshot
│   ├── mplads_completed_works_2026-09-02.csv    # 11.6 MB Completed works dataset
│   ├── mplads_expenditures_2026-09-02.csv       # 26.3 MB Transaction vouchers dataset
│   ├── mplads_mp_summary_2026-09-02.csv         # 774 MPs official summary ledger
│   └── mplads_recommended_works_2026-09-02.csv  # 22.9 MB Recommended/ongoing works dataset
│
├── dist/                               # Production compiled distribution bundle (Vite + assets)
│   ├── assets/                         # Bundled JS and CSS chunks
│   ├── index.html                      # Compiled SPA entrypoint
│   └── app.js                          # Compiled vanilla client bundle
│
├── public/                             # Public static assets & Vanilla portal
│   ├── index.html                      # Vanilla Civic Web Portal (Scrollytelling home)
│   ├── app.js                          # Vanilla client controller & API consumer
│   ├── style.css                       # Civic design system styles
│   ├── storySequence.js                # Canvas scrollytelling frame scrub controller
│   └── sequence_manifest.json          # 480-frame image manifest
│
├── sequence/                           # High-definition animation sequence assets
│   └── *.webp                          # 480 frames representing the citizen-to-central story
│
├── uploads/                            # User-uploaded field audit media & evidence
│   └── photos/                         # Field inspection photos with geotags
│
└── src/                                # Primary Application Source Code
    ├── App.tsx                         # Master application orchestrator & stage controller
    ├── main.tsx                        # React DOM mounting entrypoint
    ├── index.css                       # Global Tailwind CSS directives & custom fonts
    ├── server.js                       # Express.js HTTP & REST API server
    │
    ├── components/                     # React Component Library
    │   ├── auth/                       # Role selection & statutory authentication
    │   │   └── RoleLoginPage.tsx
    │   ├── common/                     # Cross-cutting UI components & navigation
    │   │   ├── Header.tsx              # Sticky header with MongoDB Atlas indicator
    │   │   ├── Sidebar.tsx             # Role navigation sidebar
    │   │   ├── WorkDetailDrawer.tsx    # Comprehensive audit & evidence drawer
    │   │   ├── RiskExplanationModal.tsx# Algorithmic risk signal explanation
    │   │   ├── AiAssistantDrawer.tsx   # "Ask MARGA" AI Assistant powered by Gemini
    │   │   ├── GlobalSearchModal.tsx   # Fuzzy search across works, MPs, and districts
    │   │   ├── AuditLedgerModal.tsx    # Authoritative immutable event log
    │   │   ├── ReportGeneratorModal.tsx# MPR and briefing PDF/HTML generator
    │   │   ├── NotificationDrawer.tsx  # Alerts & milestone notices
    │   │   └── RolePermissionMatrixModal.tsx # Statutory guardrails modal
    │   ├── landing/                    # Scrollytelling storyboard component
    │   │   └── LandingStorySequence.tsx
    │   ├── mp/                         # Hon'ble MP Portal views
    │   │   └── MpPortal.tsx
    │   ├── da/                         # District Authority (DM / Collector) Portal
    │   │   └── DaPortal.tsx
    │   ├── ia/                         # Implementing Agency Field Camera Portal
    │   │   └── IaPortal.tsx
    │   ├── state/                      # State Nodal Officer Portal
    │   │   └── StatePortal.tsx
    │   └── mospi/                      # MoSPI Central Ministry Command Portal
    │       └── MospiPortal.tsx
    │
    ├── config/                         # Infrastructure & database configurations
    │   └── db.js                       # Mongoose connection with custom DNS SRV resolver
    │
    ├── models/                         # Mongoose Models (MongoDB Atlas Collections)
    │   ├── Work.js                     # 'works' collection model (130k+ records)
    │   ├── MP.js                       # 'mps' collection model (774 records)
    │   ├── DAReview.js                 # 'da_reviews' collection model
    │   ├── Inspection.js               # 'ia_inspections' collection model
    │   ├── Photo.js                    # 'geotagged_photos' collection model
    │   ├── Report.js                   # 'reports' collection model
    │   └── State.js                    # 'states' reference model
    │
    ├── routes/                         # Express REST API Route Controllers
    │   ├── works.js                    # /api/works CRUD, search, and audit drilldown
    │   ├── mps.js                      # /api/mps listing and portfolio breakdown
    │   ├── states.js                   # /api/states ranking and utilization
    │   ├── daReviews.js                # /api/da-reviews submission and retrieval
    │   ├── inspections.js              # /api/inspections milestone logging
    │   ├── photos.js                   # /api/photos upload and EXIF geotagging
    │   └── analytics.js                # /api/analytics national macro metrics
    │
    ├── services/                       # Application services & authoritative data layer
    │   ├── margaDatabase.ts            # Authoritative dynamic database service & sync
    │   ├── datasetService.ts           # In-memory aggregation service for official data
    │   └── supabaseClient.ts           # Optional Supabase auth & profile client
    │
    ├── types/                          # TypeScript Type Definitions & Interfaces
    │   └── index.ts                    # Work, MP, Role, Inspection, Risk types
    │
    ├── utils/                          # Utility libraries & data loaders
    │   ├── database.js                 # Unified disk JSON engine
    │   ├── datasetLoader.js            # Streaming CSV & JSON official dataset loader
    │   ├── dataCleaner.js              # Normalization for currency, dates, and names
    │   └── mockStore.js                # In-memory fallback fixtures
    │
    └── scripts/                        # Database seeding and batch migration CLI scripts
        ├── seedData.js                 # Reset & seed mock baseline into MongoDB
        └── importOfficialData.js       # Bulk import tool for official MoSPI CSV/XLSX
```

---

## 8. Build, Run, & Deployment Lifecycle

### 8.1 Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS
- **Package Manager**: `npm` (included with Node.js)
- **MongoDB Atlas Cluster**: Network Access IP Whitelist configured (`0.0.0.0/0` for development/evaluation).

### 8.2 Environment Configuration (`.env`)
```bash
# Server Port
PORT=5000

# MongoDB Atlas Cloud Connection String
MONGODB_URI=mongodb+srv://rahulshirol1017_db_user:XJibkkgrg2f3k8Cs@cluster0.getm1pv.mongodb.net/?appName=Cluster0

# Active Database Name
MONGODB_DB=mplads_db

# Environment Mode
NODE_ENV=development

# Media Upload Directory
UPLOAD_PATH=./uploads
```

### 8.3 CLI Commands

| Command | Action | Output / Behavior |
| :--- | :--- | :--- |
| `npm run dev` | Starts server via Nodemon | Boots Express on `http://localhost:5000` with live MongoDB Atlas connection and static Vite bundle. |
| `npm run build` | Compiles frontend | Runs `vite build`, bundling React 19 app into `dist/` in under 3 seconds. |
| `npm run lint` | Type checking | Executes `tsc --noEmit` to ensure 0 TypeScript compilation errors. |
| `npm start` | Production start | Runs `node src/server.js` directly for production deployment. |
| `npm run tunnel` | Cloudflare Tunnel | Exposes local server securely via Cloudflare (`https://*.trycloudflare.com`). |
| `npm run tunnel:lt` | Localtunnel | Exposes local server via Localtunnel (`https://*.loca.lt`). |
| `npm run dev:public`| Server + Tunnel | Concurrently launches `nodemon` server and `cloudflared` tunnel. |
| `npm run seed` | Database Seeder | Seeds baseline states, MPs, and sample works into MongoDB. |
| `npm run import-data`| Bulk CSV/XLSX Import | Ingests official MoSPI CSV or Excel files into MongoDB. |

---

## 9. Security, Governance, & System Resilience

1. **DNS Resilience on Windows/Node Environments**:
   Integrated automatic fallback to Google (`8.8.8.8`) and Cloudflare (`1.1.1.1`) DNS resolvers to prevent Windows SRV resolution failures (`ECONNREFUSED`) during Atlas connection establishment.
2. **Three-Tier Fallback Mechanism**:
   If the live MongoDB Atlas cluster is unreachable due to external network firewalls:
   - Level 1: System gracefully queries the persistent on-disk JSON store (`data/marga_database.json`).
   - Level 2: Stream-indexes official CSV files from `dataset/`.
   - Level 3: Client falls back to structured browser `localStorage` caching.
   The user interface never crashes, ensuring 100% demo reliability.
3. **Statutory Guardrails**:
   Enforces strict non-tampering rules where MPs cannot approve their own sanctions, Implementing Agencies cannot authorize payments to themselves, and all status transitions produce verifiable audit log entries.
