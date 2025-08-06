import dotenv from "dotenv";
import LOWPCPAgent from "./Agents/Low/PCPAgent.js";

dotenv.config(); // Load GOOGLE_API_KEY from .env

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
























// import PCPAgent from './Agents/Low/PCPAgent.js';
// import readline from 'readline';

// const apiKey = "AIzaSyANrvWIA9OlYx4y5aoIglHc2yKGh6Pn7S0";
// const pcp = new PCPAgent(apiKey);

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// async function getHealthAdvice(symptoms) {
//   try {
//     console.log(`\nGetting advice for: ${symptoms}`);
//     const advice = await pcp.generateHealthPlan(symptoms);
    
//     console.log("\nPROFESSIONAL ADVICE:");
//     console.log(advice.professional);
    
//     console.log("\nPATIENT-FRIENDLY VERSION:");
//     console.log(advice.simplified);
    
//     return true; // Success flag
//   } catch (error) {
//     console.error("Error:", error.message);
//     return false;
//   }
// }

// async function main() {
//   if (process.argv[2]) {
//     await getHealthAdvice(process.argv[2]);
//     process.exit(0);
//   }

//   console.log("\nHealth Advice Generator");
//   console.log("Enter symptoms or type 'exit' to quit\n");

//   const askForSymptoms = async () => {
//     rl.question('What symptoms are you experiencing? ', async (symptoms) => {
//       if (symptoms.toLowerCase() === 'exit') {
//         rl.close();
//         return;
//       }

//       if (symptoms.trim()) {
//         const success = await getHealthAdvice(symptoms);
//         if (success) {
//           console.log("\nWould you like advice for other symptoms?");
//         }
//       } else {
//         console.log("Please enter some symptoms.");
//       }

//       askForSymptoms(); 
//     });
//   };

//   askForSymptoms();
// }

// rl.on('close', () => {
//   console.log("\nStay healthy! Goodbye.\n");
//   process.exit(0);
// });

// main().catch(console.error);