import cron from "node-cron";
import axios from "axios";

// Set up hourly fetching of market data
let marketData: string = "";

const fetchMarketData = async () => {
  try {
    const response = await axios.get("https://api.example.com/market-data"); // Replace with a real API
    marketData = JSON.stringify(response.data);
  } catch (error) {
    console.error("Failed to fetch market data:", error);
  }
};

// Schedule this function to run every hour
cron.schedule("0 * * * *", fetchMarketData);
fetchMarketData(); // Initial fetch
