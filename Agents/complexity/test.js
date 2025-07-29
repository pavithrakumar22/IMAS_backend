import test from 'node:test';
import assert from 'node:assert';
import { loadEnv } from '../../loadEnv.js';
import { complexityTool } from './complexity.js';

// Load environment variables
loadEnv();

// Mock the ChatGoogleGenerativeAI if API key is not available in CI
if (!process.env.GOOGLE_API_KEY) {
  console.warn('GOOGLE_API_KEY not found - using mock implementation');
  jest.mock('@langchain/google-genai', () => ({
    ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      invoke: jest.fn().mockImplementation((prompt) => {
        // Simple mock logic based on prompt content
        let complexity = 'MEDIUM';
        if (prompt.includes('mild') || prompt.includes('minor')) complexity = 'LOW';
        if (prompt.includes('severe') || prompt.includes('emergency')) complexity = 'HIGH';
        
        return Promise.resolve({
          content: JSON.stringify({
            complexity,
            reason: `Mock response for ${complexity} complexity`,
            key_factors: ['mock-factor']
          })
        });
      })
    }))
  }));
}

test('Complexity Tool Tests', async (t) => {
  const testCases = [
    {
      input: "mild headache",
      expected: "LOW"
    },
    {
      input: "fever and cough",
      expected: "MEDIUM"
    },
    {
      input: "chest pain with shortness of breath",
      expected: "HIGH"
    }
  ];

  for (const testCase of testCases) {
    await t.test(`should classify "${testCase.input}" as ${testCase.expected}`, async () => {
      const result = await complexityTool.invoke(testCase.input);
      const parsed = JSON.parse(result);
      assert.strictEqual(parsed.complexity, testCase.expected);
    });
  }
});