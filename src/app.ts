import express from "express";
import cors from "cors";
import { getLastMessage } from "./utils";

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
const port = 3002;

app.get("/", async (req, res) => {
  // from Redis db
  const lastMessage = await getLastMessage();
  res.json(lastMessage);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
