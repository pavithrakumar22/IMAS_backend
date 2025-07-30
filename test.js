import PCPAgent from './Agents/Low/PCPAgent.js';

const apiKey = "AIzaSyANrvWIA9OlYx4y5aoIglHc2yKGh6Pn7S0"; // Replace with your actual API key
const pcp = new PCPAgent(apiKey);

const testCases = [
  {
    symptoms: "low-grade fever (100°F) and runny nose for 2 days",
    description: "Common cold symptoms"
  },
  {
    symptoms: "mild stomach ache after eating dairy",
    description: "Possible lactose intolerance"
  },
  {
    symptoms: "small cut on finger from paper",
    description: "Minor first aid case"
  },
  {
    symptoms: "trouble falling asleep 3 nights this week",
    description: "Mild insomnia"
  },
  {
    symptoms: "occasional headaches when stressed",
    description: "Tension headaches"
  }
];

async function runTests() {
  console.log("=== Starting PCP Agent Tests ===");
  
  for (const test of testCases) {
    console.log(`\nTest Case: ${test.description}`);
    console.log(`Symptoms: "${test.symptoms}"`);
    
    try {
      const startTime = Date.now();
      const result = await pcp.generateHealthPlan(test.symptoms);
      const responseTime = Date.now() - startTime;
      
      console.log(`\nResponse Time: ${responseTime}ms`);
      console.log("\nPROFESSIONAL ADVICE:");
      console.log(result.professional);
      
      console.log("\nPATIENT-FRIENDLY VERSION:");
      console.log(result.simplified);
      
      // Basic validation
      if (!result.professional || !result.simplified) {
        throw new Error("Missing response content");
      }
      
      console.log("✓ Test passed");
    } catch (error) {
      console.error("✗ Test failed:", error.message);
    }
  }
  
  console.log("\n=== Testing Complete ===");
}

runTests();