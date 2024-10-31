import { toFile } from "openai";
import { openai } from "../src/openai";

// Assuming you have your data in JSONL format for initial fine-tuning
const fineTuneModel = async () => {
  const response = await openai.fineTuning.jobs.create({
    training_file: "file",
    model: "gpt-4o-mini",
  });
  console.log(response);
};
