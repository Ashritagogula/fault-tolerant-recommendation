const express = require("express");

const app = express();

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

app.get("/trending", (req, res) => {
  res.json([
    { movieId: 99, title: "Trending Movie 1" },
    { movieId: 100, title: "Trending Movie 2" }
  ]);
});

const PORT = 8083;
app.listen(PORT, () => {
  console.log(`Trending Service running on port ${PORT}`);
});