# HeavenlyDoom – AegisShield: AI-Powered Income Protection for India’s Delivery Workers

> Not just to win DEVTrails 2026 – to dominate every phase, every round.

---

## 1. Problem & Vision

India’s platform-based delivery partners (Zomato, Swiggy, Zepto, Amazon, Flipkart, Dunzo, etc.) keep the digital economy running, yet lose 20–30% of their monthly income when external disruptions like extreme weather, pollution, floods, app outages, or sudden curfews wipe out their working hours. They currently absorb this loss alone, with no income safety net.

**HeavenlyDoom’s vision** is to build **AegisShield**, an AI-enabled, parametric insurance platform that automatically protects a delivery worker’s **weekly income** from such uncontrollable events – with **zero- touch claims**, **instant payouts**, and **aggressive fraud defenses** designed to survive even a “market crash” scale attack.

---

## 2. Persona & Scope

### Target Persona

For DEVTrails 2026, we focus on **Food Delivery Partners** (e.g., Zomato/Swiggy-like platforms) operating in dense urban areas.

Typical attributes:

- Works 6–7 days a week, paid on a **weekly** cycle. 
- Earnings are highly sensitive to **weather**, **traffic conditions**, and **local curfews/strikes**.
- Uses a 2-wheeler, smartphone, and a partner app to accept and complete orders.

### Coverage Scope (Golden Rules)

- **LOSS OF INCOME ONLY** – we insure **lost hours/wages** when a worker is unable to work due to external disruptions (e.g., heavy rain, floods, air quality emergency, unplanned curfew, platform-wide outage).
- We **strictly exclude**:
  - Health, life, or accident coverage.  
  - Vehicle repair, medical bills, or damage claims.

All product design, pricing, and triggers are aligned to this **income-only** promise.

---

## 3. Weekly Pricing & Parametric Triggers

### Weekly Pricing Model

Gig workers live on a **week-to-week** earnings cycle, so AegisShield is priced on a **per-week subscription basis**. At onboarding, each worker receives:

- A **baseline weekly income expectation** (from historical trip data, platform stats, and persona assumptions).  
- A **weekly premium** that dynamically adjusts based on:
  - City/zone risk (flood-prone vs historically safe).  
  - Usual working hours (night-heavy vs day-only).  
  - Seasonality (monsoon vs clear season).  
  - Historical disruption exposure and past claim patterns.

The dynamic pricing engine is AI-driven and recalculates a recommended weekly premium at renewal, always keeping the unit of pricing as **“per worker per week”**.

### Parametric Triggers (Income Loss Only)

AegisShield does **not** wait for a worker to “file” a traditional claim. Instead, it monitors parametric signals and auto-triggers potential payouts when all conditions are met:

1. **Environmental Triggers**  
   - Heavy rainfall / flood alerts from weather APIs.  
   - Extreme heat or severe pollution alerts (AQI thresholds).  
   - Localised cloudburst or waterlogging alerts (zone-level).

2. **Social / Operational Triggers**  
   - Unplanned curfews, local strikes, sudden market or zone closures.  
   - Platform outages or severe app instability in a specific region.  

3. **Income Impact Condition**  
   - Worker is **scheduled/available** to work in that zone & time window.  
   - Actual completed orders or online time **drop significantly below expected baseline** for that period.  
   - The drop cannot be explained by normal variance or worker inactivity (e.g., voluntarily going offline).

When a disruption meets both the **external trigger** and the **income impact** conditions, AegisShield automatically computes the **estimated lost income** and initiates a payout, subject to fraud checks.

---

## 4. End-to-End Workflow

### 4.1 Worker Onboarding

1. Worker signs up via **Web/Mobile** (Phase 1: Web-first, mobile-ready architecture).  
2. Connects/syncs their delivery platform account (mock integration initially).  
3. System fetches basic history (orders/week, average earnings, typical zones & hours).  
4. AegisShield:
   - Builds an **initial risk profile**.  
   - Proposes a **weekly premium + coverage band** (min–max payout per disruptive event).  

Worker can accept suggested coverage or choose from predefined tiers (Basic/Plus/Max).

### 4.2 Policy Lifecycle (Weekly)

- Policy is **weekly-renewing** with:
  - Auto-renew by default if worker has sufficient balance / payment source.  
  - Repricing hooks that can adjust premium slightly based on latest risk trends.  

- Each week, we log:
  - Hours worked, orders completed, earnings.  
  - Disruption exposures (weather, social, platform-level incidents).

### 4.3 Claim Trigger & Payout

1. **Real-time Monitoring Service** listens to:
   - Weather and environmental APIs.  
   - Platform status / traffic & order volume feeds (mocked initially).  
   - City/zone event feeds (curfew/strike data where available).  

2. When a possible disruption is detected in a zone:
   - Identify all covered workers active in or associated with that zone/time.  
   - For each worker, compute:
     - **Expected earnings** vs **actual shortfall** over that window.  

3. Pass each potential payout event through the **Fraud & Anti-Spoofing Engine** (Section 7).  

4. If event is cleared:
   - Compute payout using parametric rules (e.g., percentage of lost expected income, subject to caps).  
   - Trigger **instant payout** (simulated via Razorpay/Stripe/UPI sandbox in later phases).

5. Expose the event on:
   - Worker dashboard: “Monsoon disruption – 3 hours lost, ₹X protected”.  
   - Insurer dashboard: aggregated loss ratios, disruption heatmaps, and predictive analytics for the next week.

---

## 5. AI/ML Components

AegisShield uses AI/ML in three core areas, as required by the problem statement:

1. **Risk Profiling & Weekly Premium Prediction**  
   - Input: historical trips, hours, zones, disruption history, seasonality, and persona-level priors.  
   - Output: recommended **weekly premium** and **coverage tier** per worker.  

2. **Predictive Disruption & Income Impact Modeling**  
   - Uses weather forecasts, historical incident data, and local patterns to **predict likely disruption windows** for each zone.  
   - Helps pre‑price risk for upcoming weeks and adjust coverage offers proactively.

3. **Intelligent Fraud Detection & Anti-Spoofing**  
   - Location and activity validation using multi-signal fusion.  
   - Anomaly detection on claims and parametric events.  
   - Duplicate, collusive, and ring-level pattern detection (detailed in Section 7).

For Phase 1, AI/ML is primarily **designed and planned**; initial implementations will be simplified heuristics/stub models, then upgraded in Phases 2 and 3.

---

## 6. Platform & Tech Stack

### Platform Choice

For DEVTrails 2026, we prioritize a **responsive Web application** for both worker and insurer dashboards, with a **mobile-first design** so it can be wrapped into a mobile app in later iterations.

### Indicative Tech Stack

- **Frontend**: React / Next.js (TypeScript), TailwindCSS / Chakra UI.  
- **Backend**: Node.js / Express or NestJS (primary app & APIs).  
- **Database**: PostgreSQL (relational data: policies, events, payouts), Redis (caching & queues).  
- **AI/ML Services**: Python (FastAPI / Flask microservices), scikit-learn / PyTorch for models.  
- **Integrations**:
  - Weather APIs (OpenWeather / IMD APIs / similar – free tiers or mocks).
  - Traffic/order mocks to emulate platform data.
  - Payment gateways (Razorpay test mode / Stripe sandbox / UPI simulator).
- **Cloud & Infra**: Containerized services (Docker), CI/CD (GitHub Actions), monitoring & logging.

The architecture is intentionally **modular**, so fraud, pricing, and parametric engines are separate services that can be scaled and evolved independently.

---

## 7. Adversarial Defense & Anti-Spoofing Strategy (Market Crash Ready)

> Designed for the “500 delivery partners, fake GPS, real payouts” scenario. The streets are bleeding money. Ours won’t.

### 7.1 Threat Model

We explicitly defend against:

- **Opportunistic Spoofers** – single workers using mock-location apps or emulators to appear in flooded zones.  
- **Colluding Groups** – small clusters coordinating to trigger payouts together.  
- **Large Fraud Rings / Market Crash** – hundreds of accounts, scripts, or devices replaying patterns to drain the insurer’s liquidity pool.  
- **Insider/API Abuse (conceptual)** – misuse of platform data or credentials to forge trip and status logs.

### 7.2 Signals We Use

AegisShield’s fraud engine does **multi-signal fusion** for every potential payout event:

1. **Location Integrity Signals**  
   - GPS vs network vs platform-inferred location comparison.  
   - Speed & route sanity (no teleporting across city in minutes).  
   - Continuous route following plausible road networks.

2. **Device Integrity Signals**  
   - Emulator / rooted / jailbroken detection.  
   - Presence of known mock-location/spoofing apps.  
   - Unnaturally “perfect” GPS patterns with zero noise.

3. **Behavioral Patterns**  
   - Worker’s historical work hours, zones, earning patterns, and disruption exposure.  
   - Sudden spikes in “I am always stuck in disruption” behavior not seen before.  

4. **Graph / Network Patterns**  
   - Shared device IDs, IPs, payout accounts across workers.  
   - Highly synchronized claim times across seemingly unrelated workers.  

These are combined into a **Total Risk Score** for each event.

### 7.3 Defense Architecture (Four Layers)

1. **Zero-Trust Location Engine**  
   - Treat all location as untrusted by default.  
   - Compute a **Location Trust Score** from 0–100 based on:
     - GPS vs network vs platform consistency.  
     - Movement plausibility and route continuity.  
     - Device trustworthiness (no emulator/mock-location flags).

2. **Behavioral Anomaly Engine**  
   - Learn a per-worker profile of “normal” behavior (zones, hours, earnings distribution).  
   - Flag deviations such as:
     - Always claiming 100% disruption whenever parametric triggers fire.  
     - New accounts that immediately show extreme loss patterns.

3. **Graph & Ring Detection Engine**  
   - Model workers, devices, payout methods, and IPs as nodes in a graph.  
   - Use clustering to detect suspicious communities:
     - Many workers suddenly “moving” into the same micro-zone at once.  
     - Shared devices and bank accounts behind many accounts.  
   - Apply **ring-level** controls:
     - Exposure caps per cluster in a time window.  
     - Elevated scrutiny for all cluster events during suspected attacks.

4. **Fairness & Human-in-the-Loop**

   - Tiered decisions based on **Total Risk Score**:
     - Low risk → instant parametric payout.  
     - Medium risk → partial or slower payout with deeper automated checks.  
     - High risk → escalation to manual review, with clear explanations of risk signals.  
   - Appeals path so genuine workers caught in high-risk clusters can be reinstated.

### 7.4 Why This Survives a Market Crash

In the Market Crash scenario, a coordinated fraud ring attempts to use fake GPS to drain the liquidity pool within hours. AegisShield:

- Detects **location inconsistencies** and **device spoofing**, refusing to fully trust GPS alone.  
- Identifies **synchronized fraudulent behavior** across dozens/hundreds of accounts via graph analytics.  
- Caps payouts and applies high-friction review to suspicious clusters while keeping **instant, low-friction payouts** alive for honest workers.

This transforms our system from “GPS-based payout vending machine” into a **resilient risk engine** built to withstand systemic attacks.

---

## 8. Phase-wise Execution Plan (Aligned with DEVTrails)

### Phase 1 – Ideation & Foundation (Weeks 1–2)

**Theme**: “Know Your Delivery Worker & Design the Brain.”

Deliverables from this repo:

- This **README.md** capturing:
  - Persona, problem framing, and full workflow.  
  - Weekly pricing model & parametric triggers.  
  - AI/ML integration plan.  
  - Adversarial Defense & Anti-Spoofing Strategy (Market Crash).
  - Tech stack and high-level architecture.  
- Minimal prototype:
  - Clickable UX flow (wireframes or simple UI) for onboarding and coverage view.  
  - Basic risk & premium calculation stub.  
- A 2-minute video (linked below) summarizing strategy and minimal prototype.

> Video link: `TBD – to be added before submission`

### Phase 2 – Automation & Protection (Weeks 3–4)

**Theme**: “Protect Your Worker.”

Planned implementation:

- Working web app with:
  - Registration & KYC-lite onboarding.  
  - Policy creation & management with weekly-priced plans.  
  - Dynamic premium calculation based on basic ML/heuristics.  
  - Claims management: automatic parametric trigger + basic fraud rules.  
- Use **3–5 automated triggers** (weather, mock traffic/events) to simulate disruptions. 
- Aim for **zero-touch claims** where risk is low; escalate others.

### Phase 3 – Scale & Optimise (Weeks 5–6)

**Theme**: “Perfect for Your Worker.”

Planned implementation:

- Advanced fraud detection:
  - GPS spoofing detection, historical weather cross-check, and basic graph-based anomaly checks. 
- Instant payout simulation:
  - Integration with Razorpay/Stripe test modes or UPI simulators.
- Dashboards:
  - Worker view: weekly protected earnings, active coverage, disruption history.  
  - Insurer view: loss ratios, zone-level risk, next week’s probable disruption claims.
- Final 5-minute demo and pitch deck showcasing AI, fraud architecture, and business viability.

---

## 9. Repository Structure

Planned structure (subject to evolution):

```text
.
├─ README.md                    # You are here
├─ docs/
│  ├─ architecture.md           # Detailed system and data-flow diagrams
│  ├─ ml-design.md              # Risk, pricing, and fraud models
│  └─ adversarial-defense.md    # Extended version of Section 7
├─ frontend/
│  └─ ...                       # Web UI (React/Next.js)
├─ backend/
│  ├─ api/                      # Policy, claims, worker, admin APIs
│  └─ services/
│     ├─ pricing/               # Weekly pricing engine
│     ├─ parametric/            # Trigger ingestion & payout calculator
│     └─ fraud/                 # Anti-spoofing & adversarial defense
└─ infra/
   └─ ...                       # Docker, CI/CD, deployment configs

---

## 10. Team HeavenlyDoom

We are HeavenlyDoom, treating DEVTrails 2026 like a real startup runway:
survive the burn, crush the fraud rings, and ship an insurance product that genuinely protects India’s delivery backbone.

> Build fast. Defend hard. Never go bankrupt.