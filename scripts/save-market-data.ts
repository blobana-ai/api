import axios from "axios";
import { redis } from "../src/utils";

const saveMarketData = async () => {
  try {
    const response = await axios.get("https://api.example.com/market-data"); // Replace with a real API
    const marketData = JSON.stringify(response.data);
    await redis.connect();
    await redis.set("market_trending", marketData);
    await redis.disconnect();
  } catch (error) {
    console.error("Failed to fetch market data:", error);
  }
};

saveMarketData(); // Initial fetch
