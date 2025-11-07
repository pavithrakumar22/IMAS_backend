import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv"

dotenv.config();

export default class MedicalAssistantAgent {
  constructor(apiKey = null) {
    const finalApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!finalApiKey) {
      throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required, or pass apiKey to constructor');
    }

    console.log('🔧 MedicalAssistantAgent using API key, length:', finalApiKey.length);
    
    this.genAI = new GoogleGenerativeAI(finalApiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
    });
  }

  async getSpecialistResponses(userSymptoms, specialistTypes) {
    // Validate input
    if (!Array.isArray(specialistTypes) || specialistTypes.length === 0) {
      throw new Error("specialistTypes must be a non-empty array");
    }

    const responses = {};
    
    for (const specialistType of specialistTypes) {
      const combinedPrompt = `
You are an AI medical assistant helping an RMP or CHW with a LOW-SEVERITY case.

Specialist: ${specialistType}
Patient says: "${userSymptoms}"

Your job:
1. Provide a comprehensive guide for RMP/CHW including diagnostic steps and possible medications (with cautions)
2. Give a simple explanation for the patient (what it means, home care, when to see a doctor)

Output format (STRICT JSON ONLY):
{
  "for_professional": {
    "key_checks": ["list", "of", "physical", "exams"],
    "diagnostic_steps": ["step1", "step2", "step3"],
    "possible_causes": ["cause1", "cause2"],
    "differential_diagnosis": ["condition1", "condition2"],
    "possible_medications": [
      {
        "name": "Medication Name",
        "dose": "Standard dose",
        "duration": "Recommended duration",
        "cautions": ["contraindications/warnings"]
      }
    ],
    "tests_if_needed": ["test1", "test2"],
    "advice": "General management advice",
    "referral_criteria": ["symptom1", "symptom2"]
  },
  "for_patient": {
    "condition_explanation": "Simple explanation",
    "home_care": ["step1", "step2"],
    "warning_signs": ["symptom1", "symptom2"],
    "when_to_seek_help": "When to see doctor"
  }
}

IMPORTANT NOTES:
1. Always include "Consult a doctor before taking any medication" in patient advice
2. For medications, only suggest commonly available OTC or first-line drugs with clear cautions
3. Emphasize that final diagnosis requires professional evaluation
4. For serious symptoms, always recommend immediate medical attention
5. Keep it simple and the response should not be too long
`;

      try {
        const result = await this.model.generateContent({
          contents: [{ role: "user", parts: [{ text: combinedPrompt }] }],
        });
        const cleantext = result.response.text().replace(/json\n?/, '').replace(/$/, '').trim();
        responses[specialistType] = cleantext;
      } catch (error) {
        console.error(`❌ Error getting response from ${specialistType}:`, error.message);
        responses[specialistType] = {
          error: `Failed to get response from ${specialistType}: ${error.message}`,
          for_professional: {},
          for_patient: {}
        };
      }
    }

    return responses;
  }
}