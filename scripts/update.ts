import axios from "axios";
import {  PairsResponse } from "../src/types";
import dotenv from "dotenv";
import { saveTokenPriceChange, saveTreasuryBalance } from "../src/utils";

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
  if (priceChange !== undefined) saveTokenPriceChange(priceChange);

  // Calculate New Growth
  const { data: treasuryUsd } = await axios.get(
    `https://solana-wallet-portfolio-balance-api.p.rapidapi.com/user/total_balance?address=${process.env.TREASURY_ADDRESS}`,
    {
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "solana-wallet-portfolio-balance-api.p.rapidapi.com",
      },
    }
  );
  saveTreasuryBalance(treasuryUsd);
})();
