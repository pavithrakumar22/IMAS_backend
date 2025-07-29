import { complexityTool } from './complexity.js';
import { loadEnv } from '../../loadEnv.js';
loadEnv();

// Test cases - array of medical queries with expected complexity levels
const testCases = [
  {
    query: "mild headache for 2 days",
    expected: "LOW"
  },
  {
    query: "fever and cough for 3 days",
    expected: "MEDIUM"
  },
  {
    query: "chest pain radiating to left arm with sweating",
    expected: "HIGH"
  },
  {
    query: "persistent diarrhea for 1 week with mild dehydration",
    expected: "MEDIUM"
  },
  {
    query: "minor skin rash with no other symptoms",
    expected: "LOW"
  },
  {
    query: "sudden loss of vision in one eye",
    expected: "HIGH"
  }
];

// Run tests
async function runTests() {
  console.log("Starting Complexity Agent Tests...\n");
  let passed = 0;

  for (const [index, testCase] of testCases.entries()) {
    try {
      console.log(`Test Case ${index + 1}:`);
      console.log(`Query: "${testCase.query}"`);
      console.log(`Expected: ${testCase.expected}`);

      const startTime = Date.now();
      // Pass the input as a string directly
      const result = await complexityTool.invoke(testCase.query);
      const parsedResult = JSON.parse(result);
      const duration = Date.now() - startTime;

      console.log(`Actual: ${parsedResult.complexity}`);
      console.log(`Reason: ${parsedResult.reason}`);
      console.log(`Key Factors: ${parsedResult.key_factors?.join(', ') || 'N/A'}`);
      console.log(`Response Time: ${duration}ms`);

      // Simple assertion
      if (parsedResult.complexity === testCase.expected) {
        console.log("✅ Test PASSED\n");
        passed++;
      } else {
        console.log("❌ Test FAILED\n");
      }
    } catch (error) {
      console.error(`❌ Test ERROR: ${error.message}\n`);
      console.error(error.stack); // Add stack trace for debugging
    }
  }

  // Summary
  console.log(`\nTest Summary:`);
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
}

// Run the tests
runTests().catch(console.error);