import { Message } from "../src/types";
import { openai, redis } from "../src/utils";

const AI_PROMPT = "Just tell me what comes to your mind.";

const queryModel = async (userPrompt: string) => {
  await redis.connect();
  const currentMemory = (await redis.get("short-term-memory")) ?? "";
  const prompt = `${currentMemory}\n\n${userPrompt}`; // Append market data to the prompt

  const chatCompletion = await openai.chat.completions.create({
    model: "fine-tuned-model-id", // Use your fine-tuned model ID
    messages: [{ role: "user", content: prompt }],
  });

  const response = chatCompletion.choices[0].message.content ?? "";
  const messsageObject: Message = {
    message: response,
    timestamp: Date.now(),
    tweeted: false,
    onchain: false,
  };
  await redis.rPush("message_history", JSON.stringify(messsageObject));

  await redis.disconnect();
};

// Example call to queryModel
queryModel(AI_PROMPT);
