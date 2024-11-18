import express from "express";
import cors from "cors";
import { Message } from "./types";
import { redis } from "./utils";

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
const port = 3002;

const getAllMessages: () => Promise<Message[]> = async () => {
  await redis.connect();
  const allMessages = await redis.lRange("message_history", 0, -1);
  const validMessages = allMessages
    .filter((message) => {
      const messageObj: Message = JSON.parse(message);
      return (
        messageObj.tweeted &&
        messageObj.tweetId &&
        messageObj.onchain &&
        messageObj.txHash
      );
    })
    .map((message) => JSON.parse(message) as Message)
    .sort((a, b) => b.timestamp - a.timestamp);
  await redis.disconnect();
  return validMessages;
};

app.get("/", async (req, res) => {
  // from Redis db
  const messages: Message[] = await getAllMessages();
  res.json(messages);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
