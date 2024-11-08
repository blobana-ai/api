import { toFile } from "openai";
import { openai } from "../src/utils";

/**
 * Fine-tunes a model using the specified training file.
 * Assumes the data is in JSONL format.
 */
const fineTuneModel = async () => {
  try {
    // Create a fine-tuning job with the specified model and training file
    const response = await openai.fineTuning.jobs.create({
      training_file: "file", // Replace "file" with your actual training file ID
      model: "gpt-4o-mini",  // Specify the model to fine-tune
    });
    console.log(response); // Log the response from the fine-tuning job
  } catch (error) {
    console.error("Error in fine-tuning the model:", error); // Handle any errors
  }
};

fineTuneModel()