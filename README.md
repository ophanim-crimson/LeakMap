# LeakMap

**Community-Powered Water Infrastructure Intelligence**

LeakMap is a browser-based community reporting platform to identify, document, geotag, visualize, verify, and monitor water infrastructure issues. Citizens can report leaks, overflows, damaged taps, broken valves, supply interruptions, and other water-related problems in under 30 seconds.

## Tech Stack

| Layer      | Technology                                            |
|------------|-------------------------------------------------------|
| Frontend   | React, TypeScript, Vite, Ant Design, Leaflet, Axios   |
| Backend    | FastAPI, Python, SQLAlchemy, Pydantic                  |
| Database   | PostgreSQL + PostGIS                                   |
| Map Tiles  | OpenStreetMap                                          |
| Deployment | Vercel (frontend), Render (backend), Neon (database)   |

## Project Structure

```
LeakMap/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── api.ts           # Axios API client & types
│   │   ├── components/      # Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   ├── LeafletMap.tsx
│   │   │   ├── ReportCard.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   ├── PhotoUpload.tsx
│   │   │   ├── VerificationPanel.tsx
│   │   │   └── UpdateFeed.tsx
│   │   └── pages/           # Route-level pages
│   │       ├── Home.tsx
│   │       ├── Report.tsx
│   │       └── ReportDetail.tsx
│   └── vite.config.ts
├── backend/                 # FastAPI backend
│   ├── main.py              # API endpoints
│   ├── models.py            # SQLAlchemy + PostGIS models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── database.py          # DB connection
│   └── requirements.txt
├── database/
│   ├── schema.sql           # CREATE TABLE statements
│   └── seed.py              # 50-report seed script
├── docs/
│   └── api.md               # API documentation
├── .env.example
├── .gitignore
└── README.md
```

## Quick Start (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ with PostGIS extension

### 1. Database Setup

```bash
# Create the database
createdb leakmap

# Enable PostGIS and create tables
psql -d leakmap -f database/schema.sql
```

### 2. Backend Setup

```bash
cd LeakMap

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Create .env file (copy and edit)
cp .env.example .env
# Edit DATABASE_URL in .env to match your PostgreSQL credentials

# Seed the database with 50 demo reports
python database/seed.py

# Start the API server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app is now running at **http://localhost:5173**

## API Endpoints

| Method | Path                         | Description             |
|--------|------------------------------|-------------------------|
| POST   | `/api/reports`               | Create a new report     |
| GET    | `/api/reports`               | List/search reports     |
| GET    | `/api/reports/{id}`          | Get report detail       |
| POST   | `/api/reports/{id}/verify`   | Submit verification     |
| POST   | `/api/reports/{id}/updates`  | Add community update    |
| GET    | `/api/statistics`            | Dashboard statistics    |
| POST   | `/api/uploads`               | Upload photo            |

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set env var: `VITE_API_URL=https://your-backend.onrender.com`

### Backend → Render

Create a Web Service pointing to the `backend/` directory.

- Build: `pip install -r requirements.txt`
- Start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Set env vars: `DATABASE_URL`, `ALLOWED_ORIGINS`

### Database → Neon

1. Create a Neon project at https://neon.tech
2. Enable PostGIS: `CREATE EXTENSION postgis;`
3. Run `schema.sql` against your Neon database
4. Run `seed.py` with `DATABASE_URL` set to Neon connection string

## License

MIT
