import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadEnv } from "../../loadEnv.js";

loadEnv();

class GeminiCoordinator {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash"});

    this.specialistOptions = [
      { id: "cardiologist", desc: "heart conditions" },
      { id: "neurologist", desc: "brain and nervous system" },
      { id: "pulmonologist", desc: "lungs and respiratory system" },
      { id: "gastroenterologist", desc: "digestive system" },
      { id: "endocrinologist", desc: "hormonal and metabolic disorders" },
      { id: "infectious_disease_specialist", desc: "infections and fever" },
      { id: "gen_surgeon", desc: "surgical issues" },
      { id: "orthopedist", desc: "bones, joints, and spine" },
      { id: "dermatologist", desc: "skin and hair" },
      { id: "dietitian", desc: "nutrition and food-related issues" },
      { id: "general_physician", desc: "general and common medical conditions" }
    ];
  }

  async coordinate(symptoms) {
    if (!symptoms || symptoms.length === 0) {
      return {
        status: "invalid_input",
        doctors: [{ id: "general_physician", reason: "No symptoms provided", confidence: 0.4 }]
      };
    }

    const prompt = this.buildUnifiedPrompt(symptoms);

    try {
      const raw = await this.model.generateContent(prompt);
      const response = await raw.response.text();
      const parsed = this.parseGeminiResponse(response);

      return {
        status: "success",
        timestamp: new Date().toISOString(),
        symptoms,
        doctors: parsed,
        clinical_notes: this.generateNotes(parsed)
      };

    } catch (err) {
      console.error("Gemini Error:", err);
      return {
        status: "llm_error",
        doctors: [{ id: "general_physician", reason: "LLM fallback due to error", confidence: 0.4 }]
      };
    }
  }

  buildUnifiedPrompt(symptoms) {
    const symptomText = symptoms.join(', ');
    const options = this.specialistOptions.map(s => `- ${s.id}: ${s.desc}`).join('\n');

    return `
You are a highly trained clinical triage assistant.

Patient Symptoms:
${symptomText}

Available Specialists:
${options}

Instructions:
1. Based on the symptoms, return ONLY a JSON array of relevant specialist IDs.
2. Return multiple specialists if symptoms relate to multiple systems.
3. Include "general_physician" ONLY if the symptoms are too generic or unrelated to any specific specialty.
4. Sort the specialists based on clinical priority.
5. Return JSON only. Do not include any other text or explanation.

Example Output:
["cardiologist", "pulmonologist"]
`;
  }

  parseGeminiResponse(response) {
    try {
      const cleaned = response.trim().replace(/```(json)?/g, "");
      const specialistIds = JSON.parse(cleaned);

      if (!Array.isArray(specialistIds) || specialistIds.length === 0) {
        throw new Error("Empty or invalid response");
      }

      return specialistIds.map(id => ({
        id,
        reason: "Predicted by Gemini LLM",
        confidence: id === "general_physician" ? 0.5 : 0.9
      }));
    } catch (e) {
      console.log(`Error: ${e}`)
      console.error("Gemini parsing error:", response);
      return [{
        id: "general_physician",
        reason: "Fallback due to parsing failure",
        confidence: 0.3
      }];
    }
  }

  generateNotes(doctors) {
    if (doctors.length === 1 && doctors[0].id === "general_physician") {
      return "Routed to general physician for further evaluation.";
    }
    return `Suggested specialist consultation with: ${doctors.map(d => d.id).join(', ')}.`;
  }

  async processPatientQuery(query) {
    const symptoms = await this.extractSymptoms(query);
    return this.coordinate(symptoms);
  }

  async extractSymptoms(query) {
    const prompt = `
Extract ALL medical symptoms from this patient query:
"${query}"

Return ONLY a JSON array of symptoms. Be comprehensive but ignore non-medical information.

Examples:
- "I have fever and headache" → ["fever", "headache"]
- "My knee hurts since yesterday" → ["knee pain"]

Your response (ONLY JSON):
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response.text();
      const cleaned = response.trim().replace(/```(json)?/g, "");
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Symptom extraction failed:", error);
      return [];
    }
  }
}

export const geminiCoordinator = new GeminiCoordinator();