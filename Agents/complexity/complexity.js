import { DynamicTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { loadEnv } from '../../loadEnv.js';
loadEnv();

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY || "AIzaSyDr2z7gIVnovRtOOkya-b0BZsadhOI4i3U"
});

const extractJsonFromMarkdown = (content) => {
  if (!content) return "{}";

  if (typeof content === "object") return JSON.stringify(content);

  let str = String(content).trim();
  
  str = str.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  
  const jsonStart = str.indexOf("{");
  const jsonEnd = str.lastIndexOf("}");
  
  if (jsonStart === -1 || jsonEnd === -1) {
    return "{}";
  }
  
  str = str.substring(jsonStart, jsonEnd + 1);
  
  str = str
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
    .replace(/:\s*'([^']*?)'/g, ': "$1"')
    .replace(/\\n/g, '\\\\n')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return str;
};

const validateComplexityResponse = (result) => {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid response structure');
  }
  
  if (!result.complexity || !['LOW', 'MEDIUM', 'HIGH'].includes(result.complexity)) {
    throw new Error('Invalid or missing complexity level');
  }
  
  return {
    complexity: result.complexity,
    reason: String(result.reason || "Classification completed").replace(/["\n\r]/g, ' ').trim(),
    key_factors: Array.isArray(result.key_factors) 
      ? result.key_factors.map(f => String(f).replace(/["\n\r]/g, ' ').trim()) 
      : ["Treatment complexity assessment"],
    suggested_action: String(result.suggested_action || "Consult appropriate healthcare provider").replace(/["\n\r]/g, ' ').trim()
  };
};

const complexityTool = new DynamicTool({
  name: "complexity_classifier",
  description: "Classifies medical queries into low, medium, or high complexity based on treatment requirements and CHW capabilities",
  func: async (input) => {
    try {
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

      const prompt = `You are a medical complexity classifier. Analyze the medical query and return ONLY a valid JSON response.

CLASSIFICATION CRITERIA:
- LOW: Basic conditions treatable by CHW with OTC medications, home remedies
- MEDIUM: Conditions requiring prescription meds, basic tests, referral to nurse/GP  
- HIGH: Complex conditions needing advanced care, hospitalization, specialists

QUERY: "${query}"

Return ONLY this JSON format (no markdown, no extra text):
{"complexity":"LOW|MEDIUM|HIGH","reason":"brief explanation","key_factors":["factor1","factor2"],"suggested_action":"recommended action"}`;

      const response = await llm.invoke(prompt);
      
      let result;
      try {
        const rawContent = response.content;
        
        const jsonString = extractJsonFromMarkdown(rawContent);
        
        const parsed = JSON.parse(jsonString);
        result = validateComplexityResponse(parsed);
        
      } catch (parseError) {
        console.warn("JSON parsing failed:", parseError);
        console.warn("Raw response was:", response.content);
        
        const rawText = String(response.content).toUpperCase();
        let fallbackComplexity = "LOW";
        
        if (rawText.includes("HIGH")) {
          fallbackComplexity = "HIGH";
        }
        else if (rawText.includes("MEDIUM")) {
          fallbackComplexity = "MEDIUM";
        }
        
        result = {
          complexity: fallbackComplexity,
          reason: "Automatic classification due to parsing error",
          key_factors: ["System parsing issue"],
          suggested_action: "Seek appropriate healthcare consultation"
        };
      }
      
      return JSON.stringify(result);
      
    } catch (error) {
      console.error("Error in complexity classification:", error);
      return JSON.stringify({
        complexity: "LOW",
        reason: "Error occurred during classification",
        key_factors: ["System error"],
        suggested_action: "Seek CHW assistance for proper evaluation"
      });
    }
  }
});

export { complexityTool };