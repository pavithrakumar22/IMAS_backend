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
  description: "Classifies medical queries into low, medium, or high complexity based on patient symptoms and conditions",
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

      const prompt = `Analyze the following medical query and classify its complexity level as either LOW, MEDIUM, or HIGH based on:
      
1. Number and severity of symptoms
2. Presence of chronic or multiple conditions
3. Potential urgency/risk factors
4. Complexity of diagnosis required

CLASSIFICATION GUIDELINES:
- LOW: Single, mild symptom with no apparent risk factors (e.g., common cold, minor rash)
- MEDIUM: Multiple symptoms or one moderate symptom (e.g., persistent cough with fever, moderate abdominal pain)
- HIGH: Severe symptoms, multiple concerning symptoms, or potential emergency (e.g., chest pain with shortness of breath, neurological symptoms)

MEDICAL QUERY TO CLASSIFY:
"${query}"

Provide your response in JSON format with the following structure:
{
  "complexity": "LOW|MEDIUM|HIGH",
  "reason": "Brief explanation for the classification",
  "key_factors": ["list", "of", "key", "factors"]
}

Return ONLY the JSON object without any additional text or markdown formatting.`;

      const response = await llm.invoke(prompt);
      
      let result;
      try {
        const rawContent = response.content;
        const jsonString = extractJsonFromMarkdown(rawContent);
        result = JSON.parse(jsonString);
        
        if (!result.complexity || !['LOW', 'MEDIUM', 'HIGH'].includes(result.complexity)) {
          throw new Error("Invalid complexity value in response");
        }
        
        result.reason = result.reason || "No reason provided";
        result.key_factors = Array.isArray(result.key_factors) ? result.key_factors : ["Unspecified factors"];
        
      } catch (e) {
        console.warn("Failed to parse LLM response:", e);
        result = {
          complexity: "LOW", // Default to LOW instead of MEDIUM for safety
          reason: "Automatic classification failed - defaulting to low complexity",
          key_factors: ["Classification error"]
        };
      }
      
      return JSON.stringify(result);
    } catch (error) {
      console.error("Error in complexity classification:", error);
      return JSON.stringify({
        complexity: "LOW", // Default to LOW instead of MEDIUM for safety
        reason: "Error occurred during classification: " + error.message,
        key_factors: ["System error"]
      });
    }
  }
});

export { complexityTool };