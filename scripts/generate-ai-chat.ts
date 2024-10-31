const queryModel = async (userPrompt: string) => {
  const prompt = `${marketData}\n\n${userPrompt}`; // Append market data to the prompt

  const response = await openai.createCompletion({
    model: "fine-tuned-model-id", // Use your fine-tuned model ID
    prompt: prompt,
    max_tokens: 100,
  });

  console.log(response.data.choices[0].text);
};

// Example call to queryModel
queryModel("What's the latest trend in the market?");
