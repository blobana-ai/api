import OpenAI from "openai";
import { createClient } from "redis";
import { TweetV2, TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";
import { BLOB_PROFILE, CONSTRAINTS } from "../scripts/blob-info";
import { Message } from "./types";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import * as bip39 from "bip39";
import * as anchor from "@coral-xyz/anchor";
import { Idl } from "@coral-xyz/anchor";

import idlJson from "./memo-idl.json";
const idl = idlJson as Idl;

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

// Replace these with your values
const DEVNET_RPC_URL = "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(process.env.SOLANA_MEMO_PROGRAM_ID ?? "");
const SENDER_KEYPAIR = getKeypairFromSeed(process.env.SOLANA_SEED_PHRASE ?? "");

const connection = new Connection(DEVNET_RPC_URL, "confirmed");

function getKeypairFromSeed(seedPhrase: string) {
  // Validate the seed phrase
  const seed = bip39.mnemonicToSeedSync(seedPhrase, "");
  const keypair = Keypair.fromSeed(seed.slice(0, 32));

  return keypair;
}

export async function submitOnchain(message: Message) {
  // Set up the provider
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(SENDER_KEYPAIR),
    {
      preflightCommitment: "processed",
    }
  );
  anchor.setProvider(provider);

  // Load the program
  const program = new anchor.Program(idl, provider);

  // Convert message to bytes
  const memoData = Buffer.from(
    `Message: ${message.message}\nEmotion: ${message.emotion}\nToken: $${message.price}\nMCap: ${message.mcap}\nHolders: ${message.holders}\nTreasury: ${message.treasury}`,
    "utf-8"
  );

  const balanceInLamports = await connection.getBalance(
    SENDER_KEYPAIR.publicKey
  );
  console.log({ balanceInLamports, pub: SENDER_KEYPAIR.publicKey.toBase58() });

  const txSignature = await program.methods
    .postMessage(memoData)
    .accounts({
      signerAccount: SENDER_KEYPAIR.publicKey,
    })
    .rpc();

  console.log(`Transaction confirmed with signature: ${txSignature}`);
  return txSignature;
}

export async function getBlockNumberFromTxHash(txHash: string) {
  // Initialize Solana connection
  try {
    // Fetch transaction details using the transaction hash
    const transaction = await connection.getTransaction(txHash, {
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      console.error("Transaction not found!");
      return null;
    }

    // Extract the slot from the transaction
    const slot = transaction.slot;
    return slot;
  } catch (error) {
    console.error("Error fetching block number:", error);
    return null;
  }
}

export async function getLastMessage() {
  await redis.connect();
  const lastMessage = await redis.lRange("message_history", -1, -1);
  const lastMsg: Message = JSON.parse(lastMessage[0]);
  await redis.disconnect();
  return lastMsg;
}

export async function updateLastMessage(msg: Message) {
  await redis.connect();
  await redis.rPop("message_history");
  await redis.rPush("message_history", JSON.stringify(msg));
  await redis.disconnect();
}

export async function postTweet(text: string): Promise<string> {
  try {
    // Send a tweet
    const { data } = await twitter.v2.tweet(text);
    console.log("Tweet posted successfully!", data);
    return data.id;
  } catch (error) {
    console.error("Error posting tweet:", error);
    return "";
  }
}

export async function fetchMentions() {
  try {
    await redis.connect();
    const since_id = (await redis.get("last_mention_id")) ?? "0";
    console.log({ since_id });
    await redis.disconnect();

    // Fetch recent mentions (limit: 5 for example)
    const { tweets } = await twitter.v2.userMentionTimeline(
      (
        await twitter.v2.me()
      ).data.id,
      {
        expansions: "author_id",
        since_id,
      }
    );

    return tweets;
  } catch (error) {
    console.error("Error fetching mentions:", error);
    return [];
  }
}

export async function replyToMention(
  tweetId: string,
  username: string,
  mentionText: string,
  replyText: string
) {
  try {
    // Reply to a specific mention
    const { data } = await twitter.v2.reply(replyText, tweetId);
    console.log(`Replied to @${username} with tweet ID ${data.id}`);
    await redis.connect();
    const chat_history = JSON.parse(
      (await redis.hGet("mentions", username)) ?? "[]"
    );
    chat_history.push({ role: "user", content: mentionText });
    chat_history.push({ role: "blob", content: replyText });
    chat_history.length > 6 && chat_history.splice(0, 2);
    await redis.hSet("mentions", username, JSON.stringify(chat_history));
    await redis.disconnect();
  } catch (error) {
    console.error(`Error replying to @${username}:`, error);
  }
}

const calcTweetPoints = (tweet: TweetV2) => {
  if (!tweet.promoted_metrics) return 0;

  const {
    impression_count,
    like_count,
    retweet_count,
    url_link_clicks,
    user_profile_clicks,
  } = tweet.promoted_metrics;

  return (
    impression_count * 0.3 +
    like_count * 0.4 +
    retweet_count * 0.15 +
    url_link_clicks * 0.05 +
    user_profile_clicks * 0.1
  );
};

export async function replyToAllMentions() {
  const mentions = await fetchMentions();
  console.log(mentions.length);
  if (mentions[0]) {
    await redis.connect();
    await redis.set("last_mention_id", mentions[0].id);
    await redis.disconnect();
  }
  const onlyTop5 = mentions
    .sort((a, b) => calcTweetPoints(b) - calcTweetPoints(a))
    .slice(0, 5);
  for (const mention of onlyTop5) {
    const tweetId = mention.id;
    console.log(tweetId);
    const username = mention.author_id ?? "";
    console.log(mention.text);
    console.log(`mention: ${mention.author_id}`);

    await redis.connect();
    const chat_history = (await redis.hGet("mentions", username)) ?? "[]";
    await redis.disconnect();

    const replyText = `${await queryModel(`
      here are chat history:
      ${chat_history}
      Now, the user asked you as below:
      "${mention.text}"

      Respond this with your current feeling at your current growth level, Blob.
      `)}`;
    console.log(replyText);
    await replyToMention(tweetId, username, mention.text, replyText);
  }
}

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
  oldMcap: number,
  mcap: number,
  userPrompt: string
) {
  const recentInfo = `
    Now, here is current situation:
    old Blob Price: ${oldTokenPrice}
    new Blob Price: ${newTokenPrice}
    old Treasury Value: ${oldTreasuryValue}
    new Treasury Value: ${newTreasuryValue}
    old Market Cap: ${oldMcap}
    Market Cap: ${mcap}
  `;

  return `
  ${BLOB_PROFILE}
  ${recentInfo}
  ${CONSTRAINTS}
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
  const oldMcap = Number((await redis.get("old_mcap")) ?? 0);
  const mcap = Number((await redis.get("mcap")) ?? 0);

  const prompt = generateExcitementPrompt(
    oldTokenPrice,
    currentTokenPrice,
    oldTreasuryValue,
    currentTreasuryValue,
    oldMcap,
    mcap,
    userPrompt
  )!;

  const chatCompletion = await openai.chat.completions.create({
    // model: "gpt-3.5-turbo-0125",
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

export const getCurrentEmotion = async () => {
  await redis.connect();
  await redis.get("emotion");
};

export const calculateGrowth = (mcap: number) => {
  const growthLevels = [1000000, 3000000, 10000000, 25000000];
  const growthStages = ["baby", "child", "teen", "fatter"];

  const index = growthLevels.findIndex((level) => mcap < level);
  return growthStages[index];
};

export const findHolders = async (mint: string) => {
  // Pagination logic
  let page = 1,
    holders = 0;
  // allOwners will store all the addresses that hold the token

  while (true) {
    const response = await fetch(process.env.HELIUS_RPC_URL ?? "", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "getTokenAccounts",
        id: "helius-test",
        params: {
          page: page,
          limit: 1000,
          displayOptions: {},
          //mint address for the token we are interested in
          mint,
        },
      }),
    });
    const data = await response.json();
    // Pagination logic.
    if (!data.result || data.result.token_accounts.length === 0) {
      console.log(`No more results. Total pages: ${page - 1}`);
      break;
    }
    // Adding unique owners to a list of token owners.
    holders += data.result.token_accounts.length;
    page++;
  }

  return holders;
};
