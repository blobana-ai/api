import axios from "axios";
import { redis } from "../src/utils";

const saveMarketData = async () => {
  try {
    const response = await axios.get("https://api.example.com/market-data"); // Replace with a real API
    const marketData = JSON.stringify(response.data);
    await redis.connect();
    const currentMemory = (await redis.get("short-term-memory")) ?? "";
    await redis.set("short-term-memory", currentMemory + "\n" + marketData);
    await redis.disconnect()
  } catch (error) {
    console.error("Failed to fetch market data:", error);
  }
};

saveMarketData(); // Initial fetch
