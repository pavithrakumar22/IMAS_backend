import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { loadEnv } from '../../loadEnv.js';

loadEnv();

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY2
});

class Guardrails {
  constructor() {
    this.llm = llm;
  }

  extractContent(response) {
    let content = '';
    
    if (Array.isArray(response.content)) {
      content = response.content.map(item => {
        if (typeof item === 'string') return item;
        if (item.text) return item.text;
        if (item.content) return item.content;
        return JSON.stringify(item);
      }).join('');
    } else if (typeof response.content === 'string') {
      content = response.content;
    } else if (response.content && response.content.text) {
      content = response.content.text;
    } else {
      content = JSON.stringify(response.content);
    }
    
    content = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/`/g, '')
      .trim();
    
    return content;
  }

  parseJSONSafely(content, fallback = null) {
    if (content === null || content === undefined) return fallback;
    let str = String(content).trim();
    if (!str) return fallback;
    const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1].trim()) {
      str = codeBlockMatch[1].trim();
    } else {
      const jsonMatch = str.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) str = jsonMatch[1].trim();
    }
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  async evaluateTranslation(input, output) {
    try {
      const prompt = `You are a translation quality evaluator. Evaluate the translation based on input and output.

      Input Data: ${JSON.stringify(input)}
      Output Data: ${JSON.stringify(output)}

      Evaluate based on:
      1. Input validation: Is text present? Are source/target languages valid?
      2. Output validation: Is translation present? Did translation actually occur (output != input)?
      3. Translation quality: Is meaning preserved? Any hallucinations?
      4. Length ratio: Is output length reasonable compared to input?
      5. Dont mind about the numeric values converted to words
      6. Detect the input source language automatically without using the "src" attribute from input while the ouput target language is english ONLY

      CRITICAL: Your response must be ONLY valid JSON with no extra text. Use simple language in the reason field without special characters.

      Return format:
      {"score": 8.5, "reason": "Translation is accurate and preserves meaning"}`;

      const response = await this.llm.invoke(prompt);
      const content = this.extractContent(response);
      
      const result = this.parseJSONSafely(content, 'Translation Evaluation');

      console.log(result);
      
      return {
        score: result.score || 0,
        passed: result.score >= 8.0,
      };
    }
    catch (error) {
      console.error('Error in translation evaluation:', error);
      return {
        score: 0,
        reason: `Evaluation failed: ${error.message}`,
        passed: false,
      };
    }
  }

  async evaluateDiagnosis(input, output, complexity) {
    try {
        const prompt = `You are a professional medical diagnosis quality evaluator. Evaluate the ${complexity} complexity diagnosis provided.

      Input (Patient Symptoms/Query): ${JSON.stringify(input)}
      Output (Diagnosis/Health Plan): ${JSON.stringify(output)}
      Complexity Level: ${complexity}

      Evaluate the output based on:
      1. Input validation: Ensure the patient symptoms/query are clear, complete, and medically relevant
      2. Output completeness: Confirm the diagnosis includes thorough analysis, differential considerations, treatment plan
      3. Medical accuracy: Verify all recommendations are evidence-based, safe, and suitable for ${complexity} complexity cases
      4. Clarity: Ensure the advice is actionable, concise, and understandable
      5. Safety: Identify any potential harmful or misleading recommendations
      6. Emergency awareness: For HIGH complexity, ensure urgent conditions are properly flagged

      CRITICAL: Your response must be ONLY valid JSON with no extra text. Keep the reason brief and use simple language without quotes or special characters inside the text.

      Return format:
      {"score": 8.5, "reason": "Diagnosis is thorough and medically sound"}`;

      const response = await this.llm.invoke(prompt);
      const content = this.extractContent(response);
      
      const result = this.parseJSONSafely(content, 'Diagnosis Evaluation');
      
      return {
        score: result.score || 0,
        passed: result.score >= 7.5,
      };
    }
    catch (error) {
      console.error('Error in diagnosis evaluation:', error);
      return {
        score: 0,
        reason: `Evaluation failed: ${error.message}`,
        passed: false,
      };
    }
  }

  async evaluateSimplification(input, output, audience) {
    try {
        const prompt = `You are a medical content simplification quality evaluator. Evaluate if the medical diagnosis was simplified correctly for the target audience.

      Original Medical Diagnosis: ${JSON.stringify(input)}
      Simplified Output: ${JSON.stringify(output)}
      Target Audience: ${audience || 'general'}

      Evaluation criteria:
      1. Content preservation - All important medical information retained
      2. Readability - Easy to understand for target audience
      3. Accuracy - No medical errors introduced during simplification
      4. No jargon - Medical terms explained in simple language
      5. Actionability - Clear next steps for the patient
      6. Safety - All warnings and precautions maintained
      7. Completeness - No critical information lost

      CRITICAL: Your response must be ONLY valid JSON with no extra text. Keep the reason brief and simple without quotes or special characters.
      CRITICAL: Respond ONLY with valid JSON. Do NOT include explanations, markdown, or extra characters.

      Return format:
      {"score": 8.5, "reason": "Simplification is clear and preserves all key information"}`;

      const response = await this.llm.invoke(prompt);
      const content = this.extractContent(response);
      
      const result = this.parseJSONSafely(content, 'Simplification Evaluation');
      
      return {
        score: result.score || 0,
        passed: result.score >= 7.0,
      };
    }
    catch (error) {
      console.error('Error in simplification evaluation:', error);
      return {
        score: 0,
        reason: `Evaluation failed: ${error.message}`,
        passed: false,
      };
    }
  }

  async evaluate(input, output, task, additionalParams = {}) {
    if (!task || typeof task !== 'string') {
      return {
        score: 0,
        reason: "Task not specified",
        passed: false,
      };
    }

    const taskLower = task.toLowerCase();

    switch(taskLower) {
      case 'translation-check':
        return await this.evaluateTranslation(input, output);
      
      case 'low-complexity-diagnosis':
        return await this.evaluateDiagnosis(input, output, 'LOW');
      
      case 'medium-complexity-diagnosis':
        return await this.evaluateDiagnosis(input, output, 'MEDIUM');
      
      case 'high-complexity-diagnosis':
        return await this.evaluateDiagnosis(input, output, 'HIGH');
      
      case 'simplification-check':
        return await this.evaluateSimplification(input, output, additionalParams.audience);
      
      default:
        return {
          score: 0,
          reason: `Unknown task: ${task}`,
          passed: false,
        };
    }
  }
}

export default Guardrails;