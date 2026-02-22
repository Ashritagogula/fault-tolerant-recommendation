# 🎬 Fault-Tolerant Movie Recommendation System
## Implementing Circuit Breaker Pattern in Microservices

---

## 📌 Overview

This project implements a **fault-tolerant microservices-based movie recommendation system** using the **Circuit Breaker pattern**.

The system prevents cascading failures when dependent services become slow or unavailable, ensuring **high availability** and **graceful degradation**.

It consists of four containerized services orchestrated using **Docker Compose**.

# Video : 

https://youtu.be/2jTzDw4598c

---

## 🏗 Architecture

### 🔹 Services

| Service | Description |
|----------|-------------|
| `recommendation-service` | Main API that orchestrates calls |
| `user-profile-service` | Provides user preferences (mock) |
| `content-service` | Provides movie metadata (mock) |
| `trending-service` | Provides fallback trending movies |

---

## 🔄 Architecture Flow

```yaml
Client
   ↓
recommendation-service
   ↓                ↓
user-profile     content-service
        ↓
   trending-service (final fallback)
```

The recommendation-service is protected using Circuit Breakers for:

user-profile-service

content-service

# ⚡ Circuit Breaker Behavior

Each breaker has three states:

🟢 CLOSED

Requests pass normally.

Failures are monitored.

🔴 OPEN

Triggered when:

2-second timeout exceeded

50% failure rate over rolling window

Requests fail immediately (fail-fast).

No calls made to dependency.

🟡 HALF-OPEN

After 30 seconds in OPEN state.

Allows limited trial requests.

If successful → transition to CLOSED.

If failure → transition back to OPEN.

## 🛠 Configuration

| Parameter | Value |
|------------|--------|
| Timeout | 2 seconds |
| Failure Threshold | 50% |
| Rolling Window | 10 requests |
| OPEN State Duration | 30 seconds |
| HALF-OPEN Trials | 3 successful calls |


# 🚀 How to Run
1️⃣ Clone the repository
```bash
git clone <your-repo-url>
cd fault-tolerant-recommendation
```
2️⃣ Create environment file
```bash
copy .env.example .env
```
3️⃣ Build and start services
```bash
docker compose up --build
```

All services will start automatically and become healthy.

## 🔍 Health Check Endpoints
```code
http://localhost:8080/health
http://localhost:8081/health
http://localhost:8082/health
http://localhost:8083/health
```

All return:
```json
{"status":"UP"}
```

# 📡 Main API Endpoints
## 🎯 Get Recommendations

```bash
GET /recommendations/{userId}
```
Example:
```bash
curl http://localhost:8080/recommendations/123

```
## 🎛 Simulate Service Behavior
```bash
POST /simulate/{service}/{behavior}
```
Services:

- user-profile

- content

Behaviors:

- normal

- slow

- fail

Example:

```bash
curl -X POST http://localhost:8080/simulate/user-profile/slow
```

## 📊 Circuit Breaker Metrics
```bash
GET /metrics/circuit-breakers
```

Returns:
```json
{
  "userProfileCircuitBreaker": {
    "state": "OPEN",
    "failureRate": "66.7%",
    "successfulCalls": 1,
    "failedCalls": 2
  }
}
```

# 🧪 Testing Scenarios
### ✅ Normal Operation

- Both services healthy

- Combined recommendation response

- No fallback

### ⚠ Single Service Failure

- Circuit opens

- Default preferences used

- Fail-fast behavior (<50ms)

### 🚨 Both Services Fail

- Final fallback to trending-service

- Graceful degradation message

### 🔁 HALF-OPEN Recovery

- After 30 seconds

- Trial requests allowed

- On success → circuit closes

# 🐳 Docker Configuration

- All services containerized

- Healthchecks configured

- depends_on with service_healthy

- Service discovery via Docker network

- Ports exposed for evaluation

# 📁 Project Structure

```bash
recommendation-service/
user-profile-service/
content-service/
trending-service/
docker-compose.yml
.env.example
README.md
```

## 🎯 Key Concepts Demonstrated

- Circuit Breaker Pattern

- Fail-Fast Mechanism

- Graceful Degradation

- Rolling Failure Rate Calculation

- Microservices Communication

- Docker Container Orchestration

- Health Monitoring

- Resilience in Distributed Systems

# 🏆 Conclusion

This project demonstrates how to design and implement a resilient microservices architecture using the Circuit Breaker pattern to prevent cascading failures and maintain system availability.

It ensures:

- ✔ High Availability
- ✔ Controlled Failure Handling
- ✔ Fast Recovery
- ✔ Clean Microservice Separation
- ✔ Production-Style Architecture