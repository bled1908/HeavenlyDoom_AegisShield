"""
Tests for AegisShield ML Service.
Run: python -m pytest tests/ -v
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_risk_score_basic():
    payload = {
        "workerId": "test-001",
        "city": "Mumbai",
        "zones": ["mumbai"],
        "weeklyBaseEarning": 5000,
        "avgHoursPerDay": 8,
        "workingDaysPerWeek": 6,
        "platform": "ZOMATO",
        "historicalClaims": 0,
        "seasonality": "MONSOON"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/risk-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["riskScore"] <= 100
    assert data["recommendedTier"] in ("BASIC", "PLUS", "MAX")
    assert data["weeklyPremiumEstimate"] > 0
    # Monsoon + Mumbai = high risk → MAX recommended
    assert data["recommendedTier"] in ("PLUS", "MAX")


@pytest.mark.asyncio
async def test_risk_score_low_risk():
    payload = {
        "workerId": "test-002",
        "city": "Ahmedabad",
        "zones": ["ahmedabad"],
        "weeklyBaseEarning": 3000,
        "avgHoursPerDay": 6,
        "workingDaysPerWeek": 5,
        "platform": "AMAZON",
        "historicalClaims": 0,
        "seasonality": "WINTER"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/risk-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Winter + Ahmedabad + Amazon = lower risk
    assert data["riskScore"] < 60


@pytest.mark.asyncio
async def test_fraud_score_clean():
    payload = {
        "workerId": "test-001",
        "claimId": "claim-001",
        "zone": "Mumbai",
        "disruptionType": "WEATHER",
        "expectedEarning": 800,
        "actualEarning": 400,
        "locationLogs": [
            {"lat": 19.07609, "lng": 72.87723, "ts": 1700000000000, "source": "GPS"},
            {"lat": 19.07620, "lng": 72.87734, "ts": 1700000060000, "source": "GPS"},
        ]
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/fraud-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["totalScore"] <= 100
    # Legitimate 50% loss with good GPS → low fraud score
    assert data["totalScore"] < 50
    assert data["locationTrust"] > 60


@pytest.mark.asyncio
async def test_fraud_score_suspicious_teleport():
    payload = {
        "workerId": "test-003",
        "claimId": "claim-003",
        "zone": "Mumbai",
        "disruptionType": "WEATHER",
        "expectedEarning": 1000,
        "actualEarning": 0,  # 100% loss - suspicious
        "locationLogs": [
            # Teleporting from Mumbai to Delhi in 1 minute
            {"lat": 19.07609, "lng": 72.87723, "ts": 1700000000000, "source": "NETWORK"},
            {"lat": 28.61395, "lng": 77.20902, "ts": 1700000060000, "source": "NETWORK"},
        ]
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/fraud-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Teleportation + 100% loss + no GPS = high fraud score
    assert data["totalScore"] > 40
    assert data["locationTrust"] < 70


@pytest.mark.asyncio
async def test_disruption_predict():
    payload = {"zone": "Mumbai", "weekAhead": 1}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/disruption-predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["disruptionProbability"] <= 1
    assert data["predictedSeverity"] in ("LOW", "MEDIUM", "HIGH")
    assert 0 < data["confidence"] <= 1


@pytest.mark.asyncio
async def test_disruption_predict_far_future_lower_confidence():
    near = {"zone": "Chennai", "weekAhead": 1}
    far = {"zone": "Chennai", "weekAhead": 8}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r1 = (await client.post("/api/v1/disruption-predict", json=near)).json()
        r2 = (await client.post("/api/v1/disruption-predict", json=far)).json()
    # Further ahead = lower confidence
    assert r2["confidence"] < r1["confidence"]


@pytest.mark.asyncio
async def test_location_trust_clean():
    payload = {
        "workerId": "test-001",
        "reportedZone": "Mumbai",
        "points": [
            {"lat": 19.07609, "lng": 72.877234, "ts": 1700000000000, "source": "GPS", "accuracy": 12.5, "speed": 8.3},
            {"lat": 19.07631, "lng": 72.877345, "ts": 1700000030000, "source": "GPS", "accuracy": 10.1, "speed": 7.8},
            {"lat": 19.07658, "lng": 72.877490, "ts": 1700000060000, "source": "GPS", "accuracy": 11.2, "speed": 8.1},
        ]
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/location-trust", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "TRUSTED"
    assert data["trustScore"] >= 70


@pytest.mark.asyncio  
async def test_location_trust_emulator():
    payload = {
        "workerId": "test-004",
        "reportedZone": "Mumbai",
        "points": [
            # Round coordinates = emulator pattern
            {"lat": 19.08, "lng": 72.88, "ts": 1700000000000, "source": "NETWORK"},
            {"lat": 19.09, "lng": 72.89, "ts": 1700000060000, "source": "NETWORK"},
            {"lat": 19.10, "lng": 72.90, "ts": 1700000120000, "source": "NETWORK"},
        ]
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/location-trust", json=payload)
    assert response.status_code == 200
    data = response.json()
    # No GPS + round coords = suspicious or untrusted
    assert data["verdict"] in ("SUSPICIOUS", "UNTRUSTED")
    assert data["trustScore"] < 70
