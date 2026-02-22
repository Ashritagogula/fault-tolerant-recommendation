const express = require("express");

const app = express();
app.use(express.json());

let behavior = "normal"; // normal | slow | fail

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

app.get("/movies", async (req, res) => {
  if (behavior === "fail") {
    return res.status(500).json({ error: "Content service failure" });
  }

  if (behavior === "slow") {
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  res.json([
    { movieId: 101, title: "Inception", genre: "Sci-Fi" },
    { movieId: 102, title: "The Dark Knight", genre: "Action" },
    { movieId: 103, title: "Interstellar", genre: "Sci-Fi" }
  ]);
});

app.post("/internal/simulate/:state", (req, res) => {
  behavior = req.params.state;
  res.json({ message: `Behavior set to ${behavior}` });
});

const PORT = 8082;
app.listen(PORT, () => {
  console.log(`Content Service running on port ${PORT}`);
});