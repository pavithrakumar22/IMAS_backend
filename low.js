import PCPAgent from './Agents/Low/PCPAgent.js';  

const apiKey = "AIzaSyANrvWIA9OlYx4y5aoIglHc2yKGh6Pn7S0";
const pcp = new PCPAgent(apiKey);

async function getHealthAdvice(symptoms) {
  try {
    console.log(`Getting advice for: ${symptoms}`);
    const advice = await pcp.generateHealthPlan(symptoms);
    
    console.log("\nPROFESSIONAL ADVICE:");
    console.log(advice.professional);
    
    console.log("\nPATIENT-FRIENDLY VERSION:");
    console.log(advice.simplified);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

const symptoms = process.argv[2] || "";
getHealthAdvice(symptoms);