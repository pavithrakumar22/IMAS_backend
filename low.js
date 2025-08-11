import dotenv from "dotenv";
import LOWPCPAgent from "./Agents/Low/PCPAgent.js";

dotenv.config(); 

async function run() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing GOOGLE_API_KEY in .env file");
    process.exit(1);
  }

  const agent = new LOWPCPAgent(apiKey);

  const symptoms = "Mild fever and sore throat for 2 days";
  console.log("🔍 Generating health plan for symptoms:", symptoms);

  const response = await agent.generateHealthPlan(symptoms);
  console.log("✅ Generated Health Plan:");
  console.log(JSON.stringify(response, null, 2));
}

run();