import { Message } from "../src/types";
import { getLastMessage, postTweet, redis, submitOnchain, updateLastMessage } from "../src/utils";

(async () => {
  const messageObj = await getLastMessage();
  if (messageObj) {
    if (messageObj.tweeted) {
      console.log("Last message is not tweeted yet. Skipping.");
      return;
    }
    await postTweet(messageObj.message);
    messageObj.tweeted = true;
    await updateLastMessage(messageObj);
  } else {
    console.log("No message");
  }
})();
