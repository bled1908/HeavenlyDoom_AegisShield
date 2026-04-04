# AegisShield – System Architecture

## Overview

AegisShield is a microservice-based parametric income insurance platform consisting of 5 services coordinated via Docker Compose.

```mermaid
graph TB
    Browser["Browser / Mobile"]
    FE["Frontend\nNext.js 14 • Port 3000"]
    BE["Backend API\nNestJS 10 • Port 3001"]
    ML["ML Service\nFastAPI • Port 8000"]
    PG["PostgreSQL 16\nPort 5432"]
    RD["Redis 7\nPort 6379"]

    Browser --> FE
    FE --> BE
    BE --> ML
    BE --> PG
    BE --> RD

    subgraph Backend Modules
        AUTH["Auth Module\nJWT + bcrypt"]
        WORKERS["Workers Module\nRisk profile"]
        POLICIES["Policies Module\nWeekly lifecycle"]
        PRICING["Pricing Engine\nHeuristic + ML"]
        PARAMETRIC["Parametric Engine\nWeather cron + triggers"]
        CLAIMS["Claims Processor\nBull queue"]
        FRAUD["Fraud Engine\nMulti-signal fusion"]
        PAYOUTS["Payouts\nUPI simulation"]
        ADMIN["Admin / Insurer\nDashboard KPIs"]
    end

    BE --> AUTH
    BE --> WORKERS
    BE --> POLICIES
    BE --> PRICING
    BE --> PARAMETRIC
    BE --> CLAIMS
    BE --> FRAUD
    BE --> PAYOUTS
    BE --> ADMIN
```

## Parametric Claim Flow

```mermaid
sequenceDiagram
    participant Weather as Weather API
    participant Parametric as Parametric Engine
    participant Queue as Bull Queue (Redis)
    participant Processor as Claims Processor
    participant Fraud as Fraud Engine
    participant ML as ML Service
    participant DB as PostgreSQL
    participant Payout as Payout Service

    Weather->>Parametric: Rainfall / alert data (every 10 min)
    Parametric->>Parametric: Check disruption thresholds
    Parametric->>DB: Create DisruptionEvent (deduped)
    Parametric->>DB: Find affected workers in zone
    Parametric->>Queue: Enqueue process-parametric-claim × N

    Queue->>Processor: Job: workerId + policyId + disruptionEventId
    Processor->>DB: Compute expected vs actual income
    Processor->>Fraud: evaluate(workerId, claimId, locationLogs)
    Fraud->>ML: POST /api/v1/fraud-score
    ML-->>Fraud: { totalScore, locationTrust, flags }
    Fraud->>DB: Update claim.fraudScore + signals
    
    alt Score < 30 (Low Risk)
        Processor->>DB: status = APPROVED
        Processor->>Payout: initiatePayout(claimId, amount)
        Payout->>DB: PayoutLedger COMPLETED
    else Score 30–70 (Medium)
        Processor->>DB: status = PARTIAL (60% payout)
        Processor->>Payout: initiatePayout(claimId, partial)
    else Score > 70 (High Risk)
        Processor->>DB: status = ESCALATED
        Note over Processor: Manual review required
    end
```

## API Contract Summary

| Service | Base URL | Key Endpoints |
|---------|----------|---------------|
| Backend | `localhost:3001/api/v1` | `/auth/*`, `/workers/*`, `/policies/*`, `/claims/*`, `/disruptions/*`, `/admin/*`, `/fraud/*` |
| ML Service | `localhost:8000/api/v1` | `/risk-score`, `/fraud-score`, `/disruption-predict`, `/location-trust` |
| Swagger UI | `localhost:3001/api/docs` | Full interactive API docs |

## Data Model Summary

```
User ──1:1──► Worker ──1:N──► Policy ──1:N──► Claim ──1:1──► PayoutLedger
                │                                │
                └──1:N──► FraudSignal            └──► DisruptionEvent
                └──1:N──► LocationLog
```
