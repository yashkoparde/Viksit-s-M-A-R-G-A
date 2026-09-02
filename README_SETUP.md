# MARGA — MPLADS Monitoring & Analytics Platform

A governance platform for tracking and monitoring development works under the **Members of Parliament Local Area Development Scheme (MPLADS)**.

Combines official government bulk datasets with field-level inspection workflows (District Authority feasibility checks, Implementing Agency geotagged camera photos, 30-day inspection reports, Nodal Authority sample verifications, and MoSPI analytics).

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v20+ installed
- **MongoDB**: MongoDB Atlas connection string or local MongoDB instance (`mongodb://127.0.0.1:27017/mplads_db`)

### 2. Environment Configuration
Verify or edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mplads_db
NODE_ENV=development
```

### 3. Run the Development Server

#### Option A: Local & Hackathon Wi-Fi (LAN)
```bash
npm run dev
```
* Local URL: `http://localhost:5000`
* Same Wi-Fi / Hotspot: `http://172.28.3.165:5000` (accessible to team members and judges on the same network)

#### Option B: Public Internet (All-in-One for Hackathon Demos & Phones)
```bash
npm run dev:public
```
This runs the server **and** creates a secure, publicly accessible HTTPS URL via Cloudflare Tunnel (e.g., `https://xxxx.trycloudflare.com`).
* Anyone in the world / judges can access the app from their phones.
* Mobile browsers require HTTPS to grant camera and GPS permissions for the **Geotagged Camera** feature!

#### Option C: Run Tunnel in a Separate Terminal
```bash
# Terminal 1 (Server):
npm run dev

# Terminal 2 (Public Tunnel):
npm run tunnel
```

### 4. Seed Sample Data (Optional)
To immediately populate sample MPs, States, Works, DA reviews, Inspections, and Geotagged Photos:
```bash
node src/scripts/seedData.js
```

### 5. Import Official Government Dataset (CSV / Excel)
Place your exported government dataset in `data/` and run:
```bash
node src/scripts/importOfficialData.js data/sample_mplads_data.csv
```

---

## Project Structure

```text
├── data/                       # Official CSV / Excel bulk exports
│   └── sample_mplads_data.csv
├── public/                     # Frontend Web UI (Vanilla CSS + JS)
│   ├── index.html              # Dashboards, Work ID search, Camera form
│   ├── style.css               # Modern dark governance theme
│   └── app.js                  # Frontend client logic & API consumption
├── src/
│   ├── config/
│   │   └── db.js               # MongoDB connection (Mongoose)
│   ├── models/
│   │   ├── Work.js             # Central Work ID entity + GeoJSON
│   │   ├── MP.js               # MP portfolio & utilization
│   │   ├── State.js            # State performance rankings
│   │   ├── DAReview.js         # District Authority checks
│   │   ├── Inspection.js       # IA inspections & 30-day cycles
│   │   ├── Photo.js            # Geotagged camera images & GPS
│   │   └── Report.js           # 30-day inspection reports (submitted on 10th)
│   ├── routes/
│   │   ├── works.js            # Work ID search, lifecycle history
│   │   ├── mps.js              # MP portfolio & performer tiers
│   │   ├── states.js           # State-wise rankings & metrics
│   │   ├── daReviews.js        # DA feasibility examination
│   │   ├── inspections.js      # IA inspection submission
│   │   ├── photos.js           # Geotagged photo upload (GPS extraction)
│   │   └── analytics.js        # Compare engine & anomaly detection
│   ├── utils/
│   │   └── dataCleaner.js      # Status uppercase, date & amount cleaning
│   ├── scripts/
│   │   ├── importOfficialData.js # Bulk CSV/Excel importer & inspector
│   │   └── seedData.js         # Sample data seeder
│   └── server.js               # Express application entry point
├── uploads/                    # Geotagged photos & uploaded reports
├── package.json
└── .env
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/works` | List works with filters (state, district, status, search) |
| `GET` | `/api/works/:workId` | Complete history of a Work ID (DA review, IA inspections, GPS photos) |
| `POST` | `/api/works` | MP recommends new work |
| `GET` | `/api/mps` | MP list with utilization rate & performer tiers |
| `GET` | `/api/mps/:mpId` | MP portfolio breakdown |
| `GET` | `/api/states` | State-wise performance rankings |
| `POST` | `/api/da-reviews` | Record DA feasibility and guideline check |
| `POST` | `/api/inspections` | Record IA 30-day inspection & generate report |
| `POST` | `/api/photos/upload` | Upload geotagged photo with GPS metadata |
| `GET` | `/api/analytics/overview` | National summary totals |
| `GET` | `/api/analytics/compare` | Compare MPs or States with graphical metrics |
| `GET` | `/api/analytics/anomalies` | Cost anomaly, delay, and progress mismatch detection |
