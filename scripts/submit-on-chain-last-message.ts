import { getLastMessage, submitOnchain, updateLastMessage } from "../src/utils";

(async () => {
  const messageObj = await getLastMessage();
  console.log(messageObj);
  if (messageObj) {
    if (!messageObj.tweeted) {
      console.log("Last message is not tweeted yet. Skipping.");
      return;
    }
    if (messageObj.onchain) {
      console.log("Last message is already on chain. Skipping.");
      return;
    }
    await submitOnchain(messageObj.message);
    messageObj.onchain = true;
    await updateLastMessage(messageObj);
  } else {
    console.log("No message");
  }
})();
