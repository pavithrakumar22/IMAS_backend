import { GoogleGenerativeAI } from "@google/generative-ai";

export default class PCPAgent {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.5 }
    });
    this.cachedResponse = null; // Store the generated response
  }

  async generateHealthPlan(symptoms) {
    if (!this.cachedResponse) {
      const professionalPrompt = `For ${symptoms}, provide concise medical guidance in this structure:
      **Precautions**: [2 bullet points]
      **Diet**: [3 foods to eat/avoid]
      **Medications**: [OTC options if any]
      **Activity**: [Exercise tips]
      **Follow-up**: [When to seek help]
      **Advice**: [You can provide (not more than 3 points or less)]
      Keep each section to 1 sentence.`;

      const professionalResponse = await this._generateResponse(professionalPrompt);
      
      this.cachedResponse = {
        professional: professionalResponse,
        simplified: await this._simplifyResponse(professionalResponse)
      };
    }
    
    return this.cachedResponse;
  }

  async _simplifyResponse(professionalResponse) {
    const simplifiedPrompt = `Simplify this medical advice for a patient:
    ${professionalResponse}
    Use simple language (8th grade level) and bullet points.`;
    
    return this._generateResponse(simplifiedPrompt);
  }

  async _generateResponse(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      return (await result.response).text();
    } catch (e) {
      console.error("API Error:", e.message);
      return "Could not generate response. Please try again.";
    }
  }

  // Clear cache if needed (e.g., for new symptoms)
  clearCache() {
    this.cachedResponse = null;
  }
}