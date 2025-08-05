import PCPAgent from './Agents/Low/PCPAgent.js';
import readline from 'readline';

const apiKey = "AIzaSyANrvWIA9OlYx4y5aoIglHc2yKGh6Pn7S0";
const pcp = new PCPAgent(apiKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getHealthAdvice(symptoms) {
  try {
    console.log(`\nGetting advice for: ${symptoms}`);
    const advice = await pcp.generateHealthPlan(symptoms);
    
    console.log("\nPROFESSIONAL ADVICE:");
    console.log(advice.professional);
    
    console.log("\nPATIENT-FRIENDLY VERSION:");
    console.log(advice.simplified);
    
    return true; // Success flag
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
}

async function main() {
  if (process.argv[2]) {
    await getHealthAdvice(process.argv[2]);
    process.exit(0);
  }

  console.log("\nHealth Advice Generator");
  console.log("Enter symptoms or type 'exit' to quit\n");

  const askForSymptoms = async () => {
    rl.question('What symptoms are you experiencing? ', async (symptoms) => {
      if (symptoms.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      if (symptoms.trim()) {
        const success = await getHealthAdvice(symptoms);
        if (success) {
          console.log("\nWould you like advice for other symptoms?");
        }
      } else {
        console.log("Please enter some symptoms.");
      }

      askForSymptoms(); 
    });
  };

  askForSymptoms();
}

rl.on('close', () => {
  console.log("\nStay healthy! Goodbye.\n");
  process.exit(0);
});

main().catch(console.error);