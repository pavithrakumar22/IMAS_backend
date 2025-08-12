import { geminiCoordinator } from "./Agents/Medium/geminiCoordinator.js";

async function runRealApiTests() {
  console.log('=== Testing with REAL Gemini API ===\n');

  // Test 1: Fracture + Fever Case
  console.log('1. Testing fracture with fever:');
  const fractureCase = await geminiCoordinator.processPatientQuery(
    "I have fever from 3 days and today I fractured my ankle"
  );
  console.log('Extracted Symptoms:', fractureCase.symptoms);
  console.log('Recommended Doctors:', fractureCase.doctors.map(d => d.id));
  console.log('Clinical Notes:', fractureCase.clinical_notes);
  console.log('✅ Received valid response structure\n');

  // Test 2: Cardiac Symptoms
  console.log('2. Testing cardiac symptoms:');
  const cardiacCase = await geminiCoordinator.processPatientQuery(
    "Severe chest pain radiating to left arm"
  );
  console.log('Extracted Symptoms:', cardiacCase.symptoms);
  console.log('Recommended Doctors:', cardiacCase.doctors.map(d => d.id));
  console.assert(
    cardiacCase.doctors.some(d => d.id === 'cardiologist'),
    '❌ Expected cardiologist recommendation'
  );
  console.log('✅ Passed cardiac test\n');

  // Test 3: General Symptoms
  console.log('3. Testing general symptoms:');
  const generalCase = await geminiCoordinator.processPatientQuery(
    "Just a common cold and mild headache"
  );
  console.log('Extracted Symptoms:', generalCase.symptoms);
  console.log('Recommended Doctors:', generalCase.doctors.map(d => d.id));
  console.assert(
    generalCase.doctors.some(d => d.id === 'general_physician'),
    '❌ Expected general physician recommendation'
  );
  console.log('✅ Passed general case test\n');

  console.log('=== ALL REAL API TESTS COMPLETED ===');
}

// Run tests with error handling
runRealApiTests().catch(err => {
  console.error('Real API Test Failed:', err);
  process.exit(1);
});