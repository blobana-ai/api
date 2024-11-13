import { Message } from "../src/types";
import { getLastMessage, postTweet, submitOnchain } from "../src/utils";

(async () => {
  const lastMessage = await getLastMessage();
  if (lastMessage) {
    const messageObj: Message = JSON.parse(lastMessage);

    if (messageObj.tweeted) {
      console.log("Last message is not tweeted yet. Skipping.");
      return;
    }
    await postTweet(messageObj.message);
    messageObj.tweeted = true;
  } else {
    console.log("No message");
  }
})();
