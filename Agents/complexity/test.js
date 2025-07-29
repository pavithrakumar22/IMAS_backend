import { complexityTool } from './complexity.js';
import { loadEnv } from '../../loadEnv.js';
loadEnv();

// Test cases - array of medical queries with expected complexity levels
const testCases = [
  {
    "query": "The patient is a 60-year-old male, unconscious, with severe head trauma and bleeding. Oxygen saturation is 88%, BP is low, and pulse is rapid. Unable to walk. Trauma occurred 20 minutes ago.",
    "expected": "HIGH"
  },
  {
    "query": "The patient is a 35-year-old female with abdominal pain rated 6/10, has mild fever (100°F), BP and SpO₂ are normal. She reports nausea and vomiting since yesterday. She can walk but slowly.",
    "expected": "MEDIUM"
  },
  {
    "query": "A 28-year-old male reports mild sore throat and runny nose for 2 days. No fever, vitals are stable, no history of illness. Reports condition as 'good' and is mobile.",
    "expected": "LOW"
  },
  {
    "query": "70-year-old diabetic patient reports chest pain and shortness of breath for the last 1 hour. BP is high, heart rate is elevated, and he feels dizzy. He has difficulty standing. Pain level is 8.",
    "expected": "HIGH"
  },
  {
    "query": "The patient is a 22-year-old female who reports gradual onset of back pain over 3 days, pain level 5/10. No trauma. She's taking prescribed painkillers by a local RMP. Vitals are normal. No mobility issues.",
    "expected": "MEDIUM"
  }
];

// Enhanced test runner with detailed reporting
async function runTests() {
  console.log("Starting Comprehensive Complexity Agent Tests...\n");
  console.log(`Running ${testCases.length} test cases\n`);
  
  let passed = 0;
  const results = [];
  let totalResponseTime = 0;

  for (const [index, testCase] of testCases.entries()) {
    const testResult = {
      id: index + 1,
      query: testCase.query,
      expected: testCase.expected,
      status: 'pending',
      duration: 0,
      actual: null,
      reason: null,
      factors: null,
      error: null
    };

    try {
      console.log(`\nTest Case ${testResult.id}:`);
      console.log(`Query: "${testResult.query}"`);
      console.log(`Expected: ${testResult.expected}`);

      const startTime = Date.now();
      const result = await complexityTool.invoke(testResult.query);
      testResult.duration = Date.now() - startTime;
      totalResponseTime += testResult.duration;

      const parsedResult = JSON.parse(result);
      testResult.actual = parsedResult.complexity;
      testResult.reason = parsedResult.reason;
      testResult.factors = parsedResult.key_factors?.join(', ') || 'N/A';

      console.log(`Actual: ${testResult.actual}`);
      console.log(`Reason: ${testResult.reason}`);
      console.log(`Key Factors: ${testResult.factors}`);
      console.log(`Response Time: ${testResult.duration}ms`);

      if (testResult.actual === testResult.expected) {
        testResult.status = 'passed';
        passed++;
        console.log("✅ Test PASSED");
      } else {
        testResult.status = 'failed';
        console.log("❌ Test FAILED");
      }
    } catch (error) {
      testResult.status = 'error';
      testResult.error = error.message;
      console.error(`❌ Test ERROR: ${error.message}`);
    }

    results.push(testResult);
  }

  // Detailed summary
  console.log("\n\n=== TEST SUMMARY ===");
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${testCases.length - passed}`);
  console.log(`Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
  console.log(`Average Response Time: ${Math.round(totalResponseTime / testCases.length)}ms`);

  // Breakdown by complexity level
  const complexityGroups = {
    LOW: { total: 0, passed: 0 },
    MEDIUM: { total: 0, passed: 0 },
    HIGH: { total: 0, passed: 0 }
  };

  results.forEach(result => {
    if (result.expected in complexityGroups) {
      complexityGroups[result.expected].total++;
      if (result.status === 'passed') {
        complexityGroups[result.expected].passed++;
      }
    }
  });

  console.log("\n=== BREAKDOWN BY COMPLEXITY LEVEL ===");
  for (const [level, stats] of Object.entries(complexityGroups)) {
    if (stats.total > 0) {
      console.log(
        `${level}: ${stats.passed}/${stats.total} passed ` +
        `(${Math.round((stats.passed / stats.total) * 100)}%)`
      );
    }
  }

  // Show failed tests
  const failedTests = results.filter(r => r.status === 'failed');
  if (failedTests.length > 0) {
    console.log("\n=== FAILED TEST CASES ===");
    failedTests.forEach(test => {
      console.log(`\nTest #${test.id}: "${test.query}"`);
      console.log(`Expected: ${test.expected}, Actual: ${test.actual}`);
      console.log(`Reason: ${test.reason}`);
    });
  }

  return results;
}

// Run the tests
runTests().catch(console.error);