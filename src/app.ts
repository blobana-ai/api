import express from "express";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
const port = 5000;

app.get("/", (req, res) => {
  // from Redis db
  const emotion = "cheer";
  const happiness = 1;
  const growth = 1;
  res.json({
    emotion,
    happiness,
    growth,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
