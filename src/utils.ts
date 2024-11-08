import OpenAI from "openai";
import { createClient } from "redis";
import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";

dotenv.config();

const configuration = {
  apiKey: process.env.OPENAI_API_KEY,
};
export const openai = new OpenAI(configuration);
export const redis = createClient({
  password: process.env.REDIS_PASSWORD,
});

// Replace these with your actual API credentials
export const twitter = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY ?? "",
  appSecret: process.env.TWITTER_API_SECRET_KEY ?? "",
  accessToken: process.env.TWITTER_ACCESS_TOKEN ?? "",
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET ?? "",
});

export async function getLastMessage() {
  await redis.connect();
  const lastMessage = await redis.lRange("message_history", -1, -1);
  await redis.disconnect();
  return lastMessage[0];
}

export async function postTweet(text: string) {
  try {
    // Send a tweet
    const { data } = await twitter.v2.tweet(text);
    console.log("Tweet posted successfully!", data);
  } catch (error) {
    console.error("Error posting tweet:", error);
  }
}

export async function fetchMentions() {
  try {
    // Fetch recent mentions (limit: 5 for example)
    const { data: mentions } = await twitter.v2.userMentionTimeline(
      "YOUR_USER_ID",
      {
        max_results: 5,
      }
    );

    return mentions.data;
  } catch (error) {
    console.error("Error fetching mentions:", error);
    return [];
  }
}

export async function replyToMention(
  tweetId: string,
  username: string,
  replyText: string
) {
  try {
    // Reply to a specific mention
    const { data } = await twitter.v2.reply(replyText, tweetId);
    console.log(`Replied to @${username} with tweet ID ${data.id}`);
  } catch (error) {
    console.error(`Error replying to @${username}:`, error);
  }
}

export async function replyToAllMentions() {
  const mentions = await fetchMentions();
  for (const mention of mentions) {
    const tweetId = mention.id;
    const username = mention.author_id ?? "";
    const replyText = `@${username} Thanks for the mention!`;

    await replyToMention(tweetId, username, replyText);
  }
}

export async function submitOnchain(text: string) {}

export async function saveTreasuryBalance(value: number) {
  await redis.connect();
  await redis.set("treasury_value", value);
  await redis.disconnect();
}

export async function saveTokenPriceChange(value: number) {
  await redis.connect();
  await redis.set("token_price_change", value);
  await redis.disconnect();
}
