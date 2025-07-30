import { classifySeverity } from "./Agents/complexity/gemini.js";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("📝 Enter patient description: ", async (patientInput) => {
  const severity = await classifySeverity(patientInput);
  console.log("🧠 Severity Output:", severity);
  rl.close();
});
