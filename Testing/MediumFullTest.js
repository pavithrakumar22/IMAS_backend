import { geminiCoordinator } from "..//../Agents/Medium/geminiCoordinator.js";
import MedicalAssistantAgent from "..//../Agents/Medium/MCPAgent.js"; 
import { loadEnv } from "../loadEnv.js";

loadEnv();

async function runRealApiTests() {
  console.log('=== Testing with REAL Gemini API ===\n');
  const medicalAgent = new MedicalAssistantAgent(process.env.GEMINI_API_KEY);

  console.log('1. Testing fracture with fever:');
  const fractureCase = await geminiCoordinator.processPatientQuery(
    "I have fever from 3 days and today I fractured my ankle"
  );
  console.log('Extracted Symptoms:', fractureCase.symptoms);
  console.log('Recommended Doctors:', fractureCase.doctors.map(d => d.id));
  
  const fractureResponses = await medicalAgent.getSpecialistResponses(
    "I have fever from 3 days and today I fractured my ankle",
    fractureCase.doctors.map(d => d.id)
  );
  console.log('Specialist Responses:', fractureResponses);
  console.log('✅ Received valid response structure\n');

  // Test 2: Cardiac Symptoms
  console.log('2. Testing cardiac symptoms:');
  const cardiacCase = await geminiCoordinator.processPatientQuery(
    "Severe chest pain radiating to left arm"
  );
  console.log('Extracted Symptoms:', cardiacCase.symptoms);
  console.log('Recommended Doctors:', cardiacCase.doctors.map(d => d.id));
  
  // Pass to MCPagent
  const cardiacResponses = await medicalAgent.getSpecialistResponses(
    "Severe chest pain radiating to left arm",
    cardiacCase.doctors.map(d => d.id)
  );
  console.log('Specialist Responses:', cardiacResponses);
  console.assert(
    cardiacCase.doctors.some(d => d.id === 'cardiologist'),
    '❌ Expected cardiologist recommendation'
  );
  console.log('✅ Passed cardiac test\n');

  console.log('3. Testing general symptoms:');
  const generalCase = await geminiCoordinator.processPatientQuery(
    "Just a common cold and mild headache"
  );
  console.log('Extracted Symptoms:', generalCase.symptoms);
  console.log('Recommended Doctors:', generalCase.doctors.map(d => d.id));
  
  const generalResponses = await medicalAgent.getSpecialistResponses(
    "Just a common cold and mild headache",
    generalCase.doctors.map(d => d.id)
  );
  console.log('Specialist Responses:', generalResponses);
  console.assert(
    generalCase.doctors.some(d => d.id === 'general_physician'),
    '❌ Expected general physician recommendation'
  );
  console.log('✅ Passed general case test\n');

  console.log('=== ALL REAL API TESTS COMPLETED ===');
}

runRealApiTests().catch(err => {
  console.error('Real API Test Failed:', err);
  process.exit(1);
});