import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";

dotenv.config();

// Replace these with your actual API credentials
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY ?? "",
  appSecret: process.env.TWITTER_API_SECRET_KEY ?? "",
  accessToken: process.env.TWITTER_ACCESS_TOKEN ?? "",
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET ?? "",
});

async function postTweet(text: string) {
  try {
    // Send a tweet
    const { data } = await client.v2.tweet(text);
    console.log("Tweet posted successfully!", data);
  } catch (error) {
    console.error("Error posting tweet:", error);
  }
}

// Example usage
postTweet("Hello, Twitter! This is a tweet sent from my TypeScript app 🎉");

async function fetchMentions() {
  try {
    // Fetch recent mentions (limit: 5 for example)
    const { data: mentions } = await client.v2.userMentionTimeline(
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

async function replyToMention(
  tweetId: string,
  username: string,
  replyText: string
) {
  try {
    // Reply to a specific mention
    const { data } = await client.v2.reply(replyText, tweetId);
    console.log(`Replied to @${username} with tweet ID ${data.id}`);
  } catch (error) {
    console.error(`Error replying to @${username}:`, error);
  }
}

async function replyToAllMentions() {
  const mentions = await fetchMentions();
  for (const mention of mentions) {
    const tweetId = mention.id;
    const username = mention.author_id ?? "";
    const replyText = `@${username} Thanks for the mention!`;

    await replyToMention(tweetId, username, replyText);
  }
}

// Execute the function to reply to mentions
// replyToAllMentions();
