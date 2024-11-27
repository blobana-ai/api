import {
  getLastMessage,
  queryModel,
  submitStatus,
  updateMarketInfo,
} from "../src/utils";
import axios from "axios";
import { PairsResponse } from "../src/types";
import dotenv from "dotenv";

dotenv.config();

const generateAIPost = async () => {
  const lastTS = (await getLastMessage()).timestamp;
  if (Date.now() - lastTS < 600000) {
    console.log("whoops. too fast. skipping");
    return;
  }
  await updateMarketInfo();
  const msgStatus = await queryModel(
    `Generate a response in 2-3 sentences reflecting your current feeling with a tone that matches your growth level, Blob. Only mention critical status updates if applicable; otherwise, provide random thoughts. Never using uppercase letters and periods in the response. Return the output in JSON format with the following structure:
    {
      "message": "response content here",
      "emotion": "your emotion here",
      "growth": "your growth level here"
    }
    `
  );
  const { message, emotion, growth } = JSON.parse(msgStatus);
  await submitStatus(message, emotion, growth);
};

// Example call to queryModel
generateAIPost();
