import OpenAI from "openai";

const configuration = {
  apiKey: process.env.OPENAI_API_KEY,
};
export const openai = new OpenAI(configuration);
