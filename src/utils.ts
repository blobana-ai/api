import OpenAI from "openai";
import { createClient } from "redis";
import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";
import { BLOB_PROFILE } from "../scripts/blob-info";

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
    await redis.connect();
    const since_id = (await redis.get("last_mention_id")) ?? "0";
    await redis.disconnect();

    // Fetch recent mentions (limit: 5 for example)
    const { data: mentions } = await twitter.v2.userMentionTimeline(
      (
        await twitter.v2.me()
      ).data.id,
      {
        max_results: 5,
        expansions: "author_id",
        since_id,
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
  console.log(mentions.length);
  if (mentions[0]) {
    await redis.connect();
    await redis.set("last_mention_id", mentions[0].id);
    await redis.disconnect();
  }
  for (const mention of mentions) {
    const tweetId = mention.id;
    console.log(tweetId);
    const username = mention.author_id ?? "";
    console.log(mention.text);
    console.log(`mention: ${mention.author_id}`);
    const replyText = `${await queryModel(`
      Now, someone asked you as below:
      "${mention.text}"

      Respond this with your current feeling at your current growth level, Blob.
      `)}`;
    console.log(replyText);
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

function generateExcitementPrompt(
  oldTokenPrice: number,
  newTokenPrice: number,
  oldTreasuryValue: number,
  newTreasuryValue: number,
  userPrompt: string
) {
  const recentInfo = `
    Now, here is latest information:
    oldTokenPrice: ${oldTokenPrice}
    newTokenPrice: ${newTokenPrice}
    oldTreasuryValue: ${oldTreasuryValue}
    newTreasuryValue: ${newTreasuryValue} 
  `;

  return `
  ${recentInfo}
  ${BLOB_PROFILE}
  ${userPrompt}
  `;
}

export const queryModel = async (userPrompt: string) => {
  await redis.connect();
  const marketTrending = (await redis.get("market_trending")) ?? "";
  const oldTreasuryValue = Number((await redis.get("old_treasury_value")) ?? 0);
  const currentTreasuryValue = Number((await redis.get("treasury_value")) ?? 0);
  const oldTokenPrice = Number((await redis.get("old_token_price")) ?? 0);
  const currentTokenPrice = Number((await redis.get("token_price")) ?? 0);

  const prompt = generateExcitementPrompt(
    oldTokenPrice,
    currentTokenPrice,
    oldTreasuryValue,
    currentTreasuryValue,
    userPrompt
  )!;

  const chatCompletion = await openai.chat.completions.create({
    model: "ft:gpt-3.5-turbo-0125:personal::ASlClHIN",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ],
    temperature: 1,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: {
      type: "text",
    },
  });

  const message = chatCompletion.choices[0].message.content ?? "";
  await redis.disconnect();

  return message;
};
