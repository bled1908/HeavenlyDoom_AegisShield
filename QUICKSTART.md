# AegisShield – Quick Start Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 (`npm install -g pnpm@9`) |
| Python | ≥ 3.12 |
| Docker Desktop | ≥ 4.x (for full stack) |
| PostgreSQL | ≥ 16 (or use Docker) |

---

## Option A – Full Stack via Docker Compose (Recommended)

```bash
# 1. Clone & configure
git clone <repo-url>
cd HeavenlyDoom_AegisShield
cp .env.example .env
# Edit .env – fill in POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, NEXTAUTH_SECRET

# 2. Start all 5 services
cd infra
docker compose up --build -d

# 3. Run database migrations + seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed

# 4. Open your browser
#   Frontend  → http://localhost:3000
#   Swagger   → http://localhost:3001/api/docs
#   ML Docs   → http://localhost:8000/docs
```

**Demo credentials after seed:**
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@aegisshield.in` | `Admin@123456` |
| Insurer | `insurer@aegisshield.in` | `Insurer@123456` |
| Worker | `rahul.kumar@demo.in` | `Worker@123456` |

---

## Option B – Run Services Individually (Development)

### 1. PostgreSQL + Redis (Docker)
```bash
cd infra
docker compose up postgres redis -d
```

### 2. Backend (NestJS)
```bash
cd backend
cp ../.env .env
pnpm install
npx prisma migrate dev --name init
npx prisma db seed
pnpm dev
# API running at http://localhost:3001/api/v1
# Swagger at  http://localhost:3001/api/docs
```

### 3. ML Microservice (FastAPI)
```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Running at http://localhost:8000
# Swagger at http://localhost:8000/docs
```

### 4. Frontend (Next.js)
```bash
cd frontend
pnpm install
pnpm dev
# Running at http://localhost:3000
```

---

## Testing

### Backend (Jest)
```bash
cd backend
pnpm test
pnpm test:cov   # with coverage
```

### ML Service (pytest)
```bash
cd ml-service
python -m pytest tests/ -v
```

---

## Trigger a Mock Disruption (Demo Flow)

1. Login as insurer at `http://localhost:3000`
2. Open Swagger UI: `http://localhost:3001/api/docs`
3. Authenticate with insurer JWT
4. Call `POST /api/v1/disruptions/mock`:
```json
{
  "zone": "Mumbai",
  "type": "WEATHER",
  "severity": "HIGH",
  "title": "Red Alert – Heavy Monsoon Rainfall"
}
```
5. Watch claims appear on the Worker Dashboard within seconds
6. Check Insurer Dashboard for fraud alerts and KPI updates

---

