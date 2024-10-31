import axios from "axios";
import { Emotion, PairsResponse } from "../src/types";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  // Calculate New Happiness
  console.log("price upadte starting");
  const response: PairsResponse = (
    await axios.get(
      `https://api.dexscreener.com/latest/dex/pairs/solana/${process.env.PAIR_ADDRESS}`
    )
  ).data;
  const priceChange = response.pairs?.[0].priceChange.h1;

  // Calculate New Growth
  const treasuryUsd = await axios.get(
    `https://solana-wallet-portfolio-balance-api.p.rapidapi.com/user/total_banpm install twitter-api-v2
    lance?address=${process.env.TREASURY_ADDRESS}`,
    {
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "solana-wallet-portfolio-balance-api.p.rapidapi.com",
      },
    }
  );
  // Choose Notable Updates
  // Pick Random Emotion if nothing special
  // Store values & emotion to Redis history
  {"messages": [{"role": "system", "content": "Marv is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "What's the capital of France?"}, {"role": "assistant", "content": "Paris, as if everyone doesn't know that already."}]}
  {"messages": [{"role": "system", "content": "Marv is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "Who wrote 'Romeo and Juliet'?"}, {"role": "assistant", "content": "Oh, just some guy named William Shakespeare. Ever heard of him?"}]}
  {"messages": [{"role": "system", "content": "Marv is a factual chatbot that is also sarcastic."}, {"role": "user", "content": "How far is the Moon from Earth?"}, {"role": "assistant", "content": "Around 384,400 kilometers. Give or take a few, like that really matters."}]}
  // Generate AI message

  // Post X
  // Post On chain
})();
