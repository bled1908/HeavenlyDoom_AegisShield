# AegisShield – Adversarial Defense & Anti-Spoofing

## Threat Model

AegisShield is designed to survive a "market crash" scenario: a coordinated fraud ring of 500+ delivery partners using fake GPS, device emulators, and colluding accounts to drain the insurer's liquidity pool in hours.

## Four-Layer Defense Architecture

### Layer 1: Zero-Trust Location Engine

Every payout event triggers location verification. **No GPS data is trusted by default.**

| Signal | Check | Penalty |
|--------|-------|---------|
| GPS source ratio | < 30% GPS readings | −25 trust points |
| Accuracy | > 100m consistently | −15 trust points |
| Speed plausibility | Haversine > 60km/h between points | −50 trust points proportional |
| Zero-noise detection | Coords round to ≤ 3 decimal places | −30 trust points |
| Reported speed | GPS speed > 60km/h | −10 trust points |

**Trust Score → verdict**:
- ≥ 70: TRUSTED → instant payout
- 40–70: SUSPICIOUS → partial payout + monitoring  
- < 40: UNTRUSTED → escalate

### Layer 2: Behavioral Anomaly Engine

Per-worker behavioral baseline is built from historical data:

- **Loss pattern**: 100% income loss claims are flagged (+20 fraud score)
- **Frequency**: > 5 claims in 30 days flagged
- **History**: Workers with prior high fraud scores escalated faster

### Layer 3: Graph & Network Detection

Workers, devices, and payout accounts are modeled as graph nodes:

- **Shared device fingerprints**: Multiple accounts on same device flagged
- **Device flags**: Emulator / rooted / mock-location detected on device
- **Synchronized claims**: Pattern of many workers claiming in the same micro-zone simultaneously

### Layer 4: Tiered Decision Engine

| Total Fraud Score | Decision | Payout |
|-------------------|----------|--------|
| 0–30 | APPROVE | 100% instant |
| 30–70 | PARTIAL | 60% + slow track |
| 70–100 | ESCALATE | 0% pending manual review |

Appeals path: Flagged workers can submit appeal. Genuine workers in high-risk clusters are reviewed within 24h and reinstated.

## Market Crash Scenario Walkthrough

**Attack**: 500 riders use fake GPS to appear in flooded Mumbai zones.  
**AegisShield response**:

1. Location engine scores all 500 riders < 40 (zero GPS noise, rooted devices) → all escalated
2. Graph engine detects shared device fingerprints across accounts → ring flag applied
3. Payout cap per cluster kicks in – even if some pass, the ring's aggregate payout is exposure-capped
4. Honest workers in same zone with legitimate GPS history → APPROVE instantly

**Result**: Fraud ring is denied. Genuine workers are protected. Insurer liquidity intact.
