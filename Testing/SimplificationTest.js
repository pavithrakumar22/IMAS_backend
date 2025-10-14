import SimplifyAgent from '../Agents/Simplification/simplify.js';


async function testSimplification() {
    console.log('Starting Simplification Agent Test...\n');
    
    const simplifier = new SimplifyAgent();
    
    const complexMedicalText = `
    The patient presents with acute onset of pyrexia (38.9°C), non-productive cough, 
    and generalized myalgia. Differential diagnosis includes influenza-like illness, 
    but we must also consider the possibility of SARS-CoV-2 infection given the current 
    epidemiological context. Recommend PCR testing for respiratory pathogens and 
    symptomatic management with antipyretics and adequate hydration.
    `;

    console.log("Original medical text:");
    console.log(complexMedicalText);
    console.log('---\n');
    
    const audiences = ["general", "technical", "executive", "student"];
    
    for (const audience of audiences) {
        console.log(`Testing ${audience.toUpperCase()} audience...`);
        const result = await simplifier.simplifyResponse(complexMedicalText, audience);
        
        if (result.success) {
            console.log("Simplified:");
            console.log(result.simplified);
        } else {
            console.log("Error:", result.error);
        }
        console.log("---\n");
    }
}

console.log('Test file loaded, starting execution...');
testSimplification()
    .then(() => console.log('Test completed successfully!'))
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });

export { testSimplification };