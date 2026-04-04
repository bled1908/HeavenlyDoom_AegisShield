# AegisShield – ML Design

## Risk Scoring & Premium Prediction

### Features Used (Phase 1 Heuristic)

| Feature | Source | Weight |
|---------|--------|--------|
| City base risk | Historical flood/disruption data | 40% |
| Seasonal factor | Current month (monsoon = +1.4x) | 20% |
| Working hours | avgHoursPerDay > 10 = night premium | 10% |
| Historical claims | +5 score per past claim (cap 20) | 15% |
| Platform factor | ZEPTO/DUNZO = 1.05-1.1x | 15% |

### Upgrade Path → Phase 2/3

Replace `PricingService.calculatePremium()` ML call with:
```python
# Scikit-learn GradientBoostingRegressor
from sklearn.ensemble import GradientBoostingRegressor

features = [city_risk, season, hours, claims, platform_encoded]
premium = model.predict([features])[0]
```

Training data: 6+ months of historical claims × premium × actual loss ratio.

---

## Fraud Detection Model

### Signal Fusion (Current)

```
TotalFraudScore = (ML_score × 0.5) + location_penalty + network_penalty + behavior_penalty
```

| Component | Range | Description |
|-----------|-------|-------------|
| ML fraud score | 0–100 | FastAPI endpoint `/fraud-score` |
| Location trust | 0–100 | GPS plausibility engine |
| Location penalty | 0–40 pts | `(100 - locationTrust) × 0.4` |
| Network penalty | 0–45 pts | `flagCount × 15` |
| Behavior penalty | 0–40 pts | `flagCount × 8` |

### Upgrade Path → Graph Neural Network

```python
# Phase 3: Replace with GNN or Isolation Forest
import torch
from torch_geometric.nn import GCNConv

# Graph: workers → shared devices → shared bank accounts
# Edge features: shared device_id, shared IP, synchronized claim times
# Node classification: fraudulent (1) vs legitimate (0)
```

---

## Disruption Prediction

### Current Model (Seasonal + Zone)

```python
probability = base_rate[zone] × seasonal_factor × decay(week_ahead)
```

### Upgrade Path → LSTM / Prophet

```python
# Phase 2: Replace with time-series model
from prophet import Prophet

df = pd.DataFrame({
    'ds': disruption_dates,
    'y': disruption_severity_scores
})
model = Prophet(seasonality_mode='multiplicative')
model.add_seasonality(name='monsoon', period=365.25/4, fourier_order=5)
model.fit(df)
forecast = model.predict(future_dates)
```

---

## Location Trust Engine

### Zero-Trust Algorithm

```
trustScore = 100
  - (gps_ratio < 0.3)  × 25
  - (accuracy > 100m)  × 15  
  - teleport_ratio     × 50
  - zero_noise_ratio   × 30
  - speed_mismatch     × 10
```

### Verdict Thresholds

| Score | Verdict | Action |
|-------|---------|--------|
| ≥ 70 | TRUSTED | Include in instant payout |
| 40–70 | SUSPICIOUS | Flag for review, reduced payout |
| < 40 | UNTRUSTED | Reject location data entirely |
