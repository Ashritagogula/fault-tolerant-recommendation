const express = require("express");

const app = express();
app.use(express.json());

let behavior = "normal"; // normal | slow | fail

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

app.get("/profile/:userId", async (req, res) => {
  if (behavior === "fail") {
    return res.status(500).json({ error: "User service failure" });
  }

  if (behavior === "slow") {
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  res.json({
    userId: req.params.userId,
    preferences: ["Action", "Sci-Fi"]
  });
});

app.post("/internal/simulate/:state", (req, res) => {
  behavior = req.params.state;
  res.json({ message: `Behavior set to ${behavior}` });
});

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`User Profile Service running on port ${PORT}`);
});