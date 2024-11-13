import { Message } from "../src/types";
import { queryModel, redis } from "../src/utils";
import axios from "axios";
import { PairsResponse } from "../src/types";
import dotenv from "dotenv";

dotenv.config();

const generateAIPost = async () => {
  await redis.connect();
  const marketTrending = (await redis.get("market_trending")) ?? "";
  const oldTreasuryValue = Number((await redis.get("treasury_value")) ?? 0);
  const oldTokenPrice = Number((await redis.get("token_price")) ?? 0);

  // Calculate New Happiness
  console.log("price update starting");
  const response: PairsResponse = (
    await axios.get(
      `https://api.dexscreener.com/latest/dex/pairs/solana/${process.env.PAIR_ADDRESS}`
    )
  ).data;
  const price = response.pairs?.[0].priceUsd;
  console.log({ price });
  if (price) {
    await redis.set("old_token_price", oldTokenPrice);
    await redis.set("token_price", price);
  }

  // Calculate New Growth
  // const { data: newTreasuryValue } = await axios.get(
  //   `https://solana-wallet-portfolio-balance-api.p.rapidapi.com/user/total_balance?address=${process.env.TREASURY_ADDRESS}`,
  //   {
  //     headers: {
  //       "x-rapidapi-key": process.env.RAPID_API_KEY,
  //       "x-rapidapi-host": "solana-wallet-portfolio-balance-api.p.rapidapi.com",
  //     },
  //   }
  // );
  const newTreasuryValue = 1000;
  console.log({ newTreasuryValue });
  if (newTreasuryValue) {
    await redis.set("old_treasury_value", oldTreasuryValue);
    await redis.set("treasury_value", newTreasuryValue);
  }

  await redis.disconnect();

  const message = await queryModel(
    "Now, say 2-3 random sentences of your current feeling at your current growth level, Blob."
  );

  const messsageObject: Message = {
    message,
    timestamp: Date.now(),
    tweeted: false,
    onchain: false,
  };

  await redis.connect();
  await redis.rPush("message_history", JSON.stringify(messsageObject));
  await redis.disconnect();
};

// Example call to queryModel
generateAIPost();
