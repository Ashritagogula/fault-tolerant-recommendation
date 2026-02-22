require("dotenv").config();
const express = require("express");
const axios = require("axios");
const CircuitBreaker = require("opossum");

const app = express();
app.use(express.json());

const PORT = process.env.API_PORT || 8080;

const USER_PROFILE_URL =
  process.env.USER_PROFILE_URL || "http://localhost:8081";
const CONTENT_URL =
  process.env.CONTENT_URL || "http://localhost:8082";
const TRENDING_URL =
  process.env.TRENDING_URL || "http://localhost:8083";

/* ==============================
   Circuit Breaker Configuration
================================= */

const breakerOptions = {
  timeout: 2000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10
};

/* ==============================
   Service Calls
================================= */

async function fetchUserProfile(userId) {
  const response = await axios.get(
    `${USER_PROFILE_URL}/profile/${userId}`
  );
  return response.data;
}

async function fetchMovies() {
  const response = await axios.get(`${CONTENT_URL}/movies`);
  return response.data;
}

async function fetchTrending() {
  const response = await axios.get(`${TRENDING_URL}/trending`);
  return response.data;
}

/* ==============================
   Breakers
================================= */

const userBreaker = new CircuitBreaker(fetchUserProfile, breakerOptions);
const contentBreaker = new CircuitBreaker(fetchMovies, breakerOptions);

/* ==============================
   Manual Metrics Tracking
================================= */

const breakerMetrics = {
  user: {
    successes: 0,
    failures: 0,
    halfOpenTrials: 0
  },
  content: {
    successes: 0,
    failures: 0,
    halfOpenTrials: 0
  }
};

function calculateFailureRate(successes, failures) {
  const total = successes + failures;
  if (total === 0) return "0%";
  return ((failures / total) * 100).toFixed(1) + "%";
}

/* Track state changes */

userBreaker.on("success", () => {
  breakerMetrics.user.successes++;
});

userBreaker.on("failure", () => {
  breakerMetrics.user.failures++;
});

userBreaker.on("halfOpen", () => {
  breakerMetrics.user.halfOpenTrials = 0;
});

contentBreaker.on("success", () => {
  breakerMetrics.content.successes++;
});

contentBreaker.on("failure", () => {
  breakerMetrics.content.failures++;
});

contentBreaker.on("halfOpen", () => {
  breakerMetrics.content.halfOpenTrials = 0;
});

/* ==============================
   Default Preferences
================================= */

function defaultPreferences(userId) {
  return {
    userId,
    preferences: ["Comedy", "Family"]
  };
}

/* ==============================
   Health
================================= */

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

/* ==============================
   Simulation Control
================================= */

app.post("/simulate/:service/:behavior", async (req, res) => {
  const { service, behavior } = req.params;

  if (!["user-profile", "content"].includes(service))
    return res.status(400).json({ error: "Invalid service" });

  if (!["normal", "slow", "fail"].includes(behavior))
    return res.status(400).json({ error: "Invalid behavior" });

  const target =
    service === "user-profile"
      ? `${USER_PROFILE_URL}/internal/simulate/${behavior}`
      : `${CONTENT_URL}/internal/simulate/${behavior}`;

  await axios.post(target);

  res.json({ message: `${service} set to ${behavior}` });
});

/* ==============================
   Recommendations
================================= */

app.get("/recommendations/:userId", async (req, res) => {
  const userId = req.params.userId;
  let fallbackServices = [];

  let userPreferences;
  let movies;

  /* USER PROFILE */

  if (userBreaker.opened) {
    fallbackServices.push("user-profile-service");
    userPreferences = defaultPreferences(userId);
  } else {
    try {
      userPreferences = await userBreaker.fire(userId);
    } catch {
      fallbackServices.push("user-profile-service");
      userPreferences = defaultPreferences(userId);
    }
  }

  /* CONTENT */

  if (contentBreaker.opened) {
    fallbackServices.push("content-service");
    movies = [];
  } else {
    try {
      movies = await contentBreaker.fire();
    } catch {
      fallbackServices.push("content-service");
      movies = [];
    }
  }

  /* BOTH OPEN → TRENDING */

  if (fallbackServices.length === 2) {
    const trending = await fetchTrending();
    return res.status(200).json({
      message:
        "Our recommendation service is temporarily degraded. Here are some trending movies.",
      trending,
      fallback_triggered_for: fallbackServices.join(", ")
    });
  }

  const filteredMovies = movies.filter((movie) =>
    userPreferences.preferences.includes(movie.genre)
  );

  res.status(200).json({
    userPreferences,
    recommendations: filteredMovies,
    fallback_triggered_for:
      fallbackServices.length > 0
        ? fallbackServices.join(", ")
        : null
  });
});

/* ==============================
   Metrics Endpoint
================================= */

app.get("/metrics/circuit-breakers", (req, res) => {
  res.status(200).json({
    userProfileCircuitBreaker: {
      state: userBreaker.opened
        ? "OPEN"
        : userBreaker.halfOpen
        ? "HALF_OPEN"
        : "CLOSED",
      failureRate: calculateFailureRate(
        breakerMetrics.user.successes,
        breakerMetrics.user.failures
      ),
      successfulCalls: breakerMetrics.user.successes,
      failedCalls: breakerMetrics.user.failures
    },
    contentCircuitBreaker: {
      state: contentBreaker.opened
        ? "OPEN"
        : contentBreaker.halfOpen
        ? "HALF_OPEN"
        : "CLOSED",
      failureRate: calculateFailureRate(
        breakerMetrics.content.successes,
        breakerMetrics.content.failures
      ),
      successfulCalls: breakerMetrics.content.successes,
      failedCalls: breakerMetrics.content.failures
    }
  });
});

app.listen(PORT, () => {
  console.log(`Recommendation Service running on port ${PORT}`);
});