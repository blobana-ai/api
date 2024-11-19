import { Message as BlobStatus } from "../src/types";
import {
  calculateGrowth,
  findHolders,
  getBlockNumberFromTxHash,
  getLastMessage,
  postTweet,
  queryModel,
  redis,
  submitOnchain,
} from "../src/utils";
import axios from "axios";
import { PairsResponse } from "../src/types";
import dotenv from "dotenv";

dotenv.config();

const generateAIPost = async () => {
  await redis.connect();
  const marketTrending = (await redis.get("market_trending")) ?? "";
  const oldTreasuryValue = Number((await redis.get("treasury_value")) ?? 0);
  const oldTokenPrice = Number((await redis.get("token_price")) ?? 0);
  const oldMcap = Number((await redis.get("mcap")) ?? 0);

  // Calculate New Happiness
  console.log("price update starting");
  const response: PairsResponse = (
    await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${process.env.TOKEN_ADDRESS}`
    )
  ).data;
  let price = response.pairs[0].priceUsd;
  console.log({ price });
  if (price) {
    await redis.set("old_token_price", oldTokenPrice);
    await redis.set("token_price", price);
  } else {
    price = (await redis.get("token_price")) ?? "0";
  }

  // Calculate New Growth
  const { data: newTreasuryValue } = await axios.get(
    `https://solana-wallet-portfolio-balance-api.p.rapidapi.com/user/total_balance?address=${process.env.TREASURY_ADDRESS}`,
    {
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "solana-wallet-portfolio-balance-api.p.rapidapi.com",
      },
    }
  );
  console.log({ newTreasuryValue });
  if (newTreasuryValue) {
    await redis.set("old_treasury_value", oldTreasuryValue);
    await redis.set("treasury_value", newTreasuryValue.totalValue);
  }

  const mcap = response.pairs[0].marketCap ?? 0;
  console.log({mcap})
  if (mcap) {
    await redis.set("old_mcap", oldMcap);
    await redis.set("mcap", mcap);
  }

  await redis.disconnect();

  const msgStatus = await queryModel(
    `Generate a response in 2-3 sentences reflecting your current feeling with a tone that matches your growth level, Blob. Only mention critical status updates if applicable; otherwise, provide general thoughts. Avoid using uppercase letters or periods in the response. Return the output in JSON format with the following structure:
    {
      "message": "response content here",
      "emotion": "your emotion here",
      "growth": "your growth level here"
    }
    `
  );

  const { message, emotion, growth } = JSON.parse(msgStatus);
  console.log({ message, emotion, growth });

  const holders = await findHolders(process.env.TOKEN_ADDRESS ?? "");
  console.log({holders})

  const tweetId = await postTweet(message);
  let status: BlobStatus = {
    message,
    timestamp: Date.now(),
    tweeted: true,
    onchain: true,
    txHash: "",
    blocknumber: 0,
    emotion,
    growth,
    price,
    mcap,
    holders,
    tweetId,
    treasury: newTreasuryValue.totalValue,
  };
  status.txHash = await submitOnchain(status);
  status.blocknumber = (await getBlockNumberFromTxHash(status.txHash)) || 0;

  console.log(status);
  await redis.connect();
  await redis.rPush("message_history", JSON.stringify(status));
  await redis.disconnect();
};

// Example call to queryModel
generateAIPost();
