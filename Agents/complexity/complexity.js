import { DynamicTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { loadEnv } from '../../loadEnv.js';
loadEnv();

// Initialize the LLM
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY
});

// Helper function to extract JSON from Markdown response
const extractJsonFromMarkdown = (markdown) => {
  // Handle cases where response is already plain JSON
  if (typeof markdown === 'object') return markdown;
  
  const stringContent = typeof markdown === 'string' ? markdown : JSON.stringify(markdown);
  
  // Try to extract JSON from markdown code block
  const jsonMatch = stringContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1];
  }
  
  // If no markdown markers found, try parsing the whole content
  return stringContent;
};

// Define the complexity tool
const complexityTool = new DynamicTool({
  name: "complexity_classifier",
  description: "Classifies medical queries into low, medium, or high complexity based on treatment requirements and CHW capabilities",
  func: async (input) => {
    try {
      // Robust input parsing
      let query;
      if (typeof input === 'string') {
        try {
          const parsed = JSON.parse(input);
          query = parsed.query || parsed.input || parsed.text || parsed.content || input;
        } catch {
          query = input;
        }
      } else if (typeof input === 'object' && input !== null) {
        query = input.query || input.input || input.text || input.content || 
                input.symptoms || input.condition || JSON.stringify(input);
      } else {
        query = String(input);
      }

      query = query.trim();
      if (!query) {
        throw new Error("Empty medical query provided");
      }

      const prompt = `Analyze the following medical query and classify its complexity level as either LOW, MEDIUM, or HIGH based on treatment requirements and what a Community Health Worker (CHW) can manage:

CLASSIFICATION CRITERIA:
1. LOW: Conditions that can be managed with:
   - Basic over-the-counter medications (e.g., pain relievers, antacids)
   - Simple home remedies or dietary changes
   - No specialized diagnosis or monitoring required
   - Can be safely treated by a Community Health Worker (CHW)
   Examples: Common cold, mild headache, minor indigestion, simple diarrhea

2. MEDIUM: Conditions that require:
   - Prescription medications (oral)
   - Basic diagnostic tests (e.g., rapid tests, basic lab work)
   - Simple procedures like injections or wound dressings
   - Short-term monitoring
   - May require referral to a nurse or general practitioner
   Examples: Urinary tract infection, moderate fever, uncomplicated skin infection

3. HIGH: Conditions that:
   - Require advanced medical intervention (IV medications, surgery)
   - Need complex diagnostics (imaging, specialized lab tests)
   - Involve potentially life-threatening symptoms
   - Require hospitalization or specialist care
   - Cannot be managed by a CHW
   Examples: Chest pain, severe trauma, difficulty breathing, neurological symptoms

ADDITIONAL FACTORS TO CONSIDER:
- Multiple symptoms increase complexity level
- Chronic conditions may increase complexity
- Vulnerable populations (elderly, infants, pregnant) may increase complexity

MEDICAL QUERY TO CLASSIFY:
"${query}"

Provide your response in STRICT JSON format with this structure:
{
  "complexity": "LOW|MEDIUM|HIGH",
  "reason": "Explanation focusing on treatment requirements and CHW capabilities",
  "key_factors": ["list", "of", "specific", "treatment", "factors"],
  "suggested_action": "Recommended course of action based on complexity level"
}

Important:
- Return ONLY the raw JSON without any additional text
- Base classification primarily on treatment complexity
- Assume resources are limited (CHW setting)`;

      const response = await llm.invoke(prompt);
      
      let result;
      try {
        const rawContent = response.content;
        const jsonString = extractJsonFromMarkdown(rawContent);
        result = JSON.parse(jsonString);
        
        // Validate the response structure
        if (!result.complexity || !['LOW', 'MEDIUM', 'HIGH'].includes(result.complexity)) {
          throw new Error("Invalid complexity value in response");
        }
        
        // Ensure all required fields exist
        result.reason = result.reason || "No reason provided";
        result.key_factors = Array.isArray(result.key_factors) ? result.key_factors : ["Unspecified factors"];
        result.suggested_action = result.suggested_action || "No suggested action provided";
        
      } catch (e) {
        console.warn("Failed to parse LLM response:", e);
        result = {
          complexity: "LOW",
          reason: "Automatic classification failed - defaulting to low complexity",
          key_factors: ["Classification error"],
          suggested_action: "Monitor symptoms and consult a CHW for reassessment"
        };
      }
      
      return JSON.stringify(result);
    } catch (error) {
      console.error("Error in complexity classification:", error);
      return JSON.stringify({
        complexity: "LOW",
        reason: "Error occurred during classification: " + error.message,
        key_factors: ["System error"],
        suggested_action: "Seek CHW assistance for proper evaluation"
      });
    }
  }
});

export { complexityTool };