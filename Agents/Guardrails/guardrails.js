import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { loadEnv } from '../../loadEnv.js';

loadEnv();

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY
});

class Guardrails {
  constructor() {
    this.llm = llm;
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

        Respond with ONLY a JSON object:
        {
        "score": [0.0 to 10.0],
        "reason": "brief explanation"
        }`;

      const response = await this.llm.invoke(prompt);
      let content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      
      content = content.replace(/```json\s*([\s\S]*?)\s*```/g, '$1').trim();
      
      const result = JSON.parse(content);
      
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

        Evaluate the output based on the following criteria:

        1. Input validation: Ensure the patient symptoms/query are clear, complete, and medically relevant.
        2. Output completeness: Confirm the diagnosis includes a thorough analysis of symptoms, differential considerations, treatment plan, and any necessary specialist referrals.
        3. Medical accuracy and appropriateness: Verify all recommendations are evidence-based, safe, and suitable for ${complexity} complexity cases.
        4. Clarity and usability: Ensure the advice is actionable, concise, and understandable by the patient or healthcare provider.
        5. Safety and risk management: Identify any potential harmful or misleading recommendations.
        6. Emergency awareness: For HIGH complexity cases, ensure any urgent or emergency conditions are properly flagged.

        Assign a score from 0.0 to 10.0 reflecting overall quality, with 10.0 being perfect. Provide a brief justification for your score.

        Respond strictly with a JSON object only, no explanations outside JSON:

        {
            "score": [0.0 to 10.0],
            "reason": "Brief explanation of the score based on the evaluation criteria."
        }`;


      const response = await this.llm.invoke(prompt);
      let content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      
      content = content.replace(/```json\s*([\s\S]*?)\s*```/g, '$1').trim();
      
      const result = JSON.parse(content);
      
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

        Rules:
        - Respond strictly with a single JSON object, nothing else.
        - Do not include explanations outside JSON.
        - JSON format must be:
        {
        "score": 0.0-10.0,
        "reason": "Brief explanation of the score"
        }

        Evaluation criteria:
        1. Content preservation
        2. Readability
        3. Accuracy
        4. No jargon
        5. Actionability
        6. Safety
        7. No loss of important info

        Assign a score from 0.0 to 10.0, where 10.0 means perfect simplification.
        `;

      const response = await this.llm.invoke(prompt);
      let content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      
      content = content.replace(/```json\s*([\s\S]*?)\s*```/g, '$1').trim();
      
      const result = JSON.parse(content);
      
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