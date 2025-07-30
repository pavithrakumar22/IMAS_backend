import { GoogleGenerativeAI } from "@google/generative-ai";

export default class PCPAgent {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.5 }
    });
  }

  async generateHealthPlan(symptoms) {
    const professionalPrompt = `For ${symptoms}, provide concise medical guidance in this structure:
    **Precautions**: [2 bullet points]
    **Diet**: [3 foods to eat/avoid]
    **Medications**: [OTC options if any]
    **Activity**: [Exercise tips]
    **Follow-up**: [When to seek help]
    **Advice**: [You can provide (not more than 3 points or less)]
    Keep each section to 1 sentence.`;

    const simplifiedPrompt = `Simplify this medical advice for a patient:
    ${await this._generateResponse(professionalPrompt)}
    Use simple language (8th grade level) and bullet points.`;

    return {
      professional: await this._generateResponse(professionalPrompt),
      simplified: await this._generateResponse(simplifiedPrompt)
    };
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
}















// import { GoogleGenerativeAI } from "@google/generative-ai";
// import * as dotenv from "dotenv";
// dotenv.config();

// class AgentPCP {
//   /**
//    * English-only Primary Care Provider agent using Gemini
//    * @param {string} apiKey - Gemini API key
//    */
//   constructor(apiKey) {
//     this.systemPrompt = `You are a Primary Care Provider (PCP) assisting Community Health Workers (CHWs). 
//     Provide English-only medical advice with:
//     - Clear diagnosis based on symptoms
//     - Relevant follow-up questions
//     - Practical management advice
//     - Organized summary for CHWs
//     - Rural-appropriate recommendations`;

//     // Configure Gemini
//     this.genAI = new GoogleGenerativeAI(apiKey);
//     this.model = this.genAI.getGenerativeModel({ 
//       model: "gemini-2.5-flash",
//       generationConfig: { temperature: 0.7 }
//     });
//     this.chat = this.model.startChat({
//       history: []
//     });
//   }

//   /**
//    * Generate medical response to English patient/CHW query
//    * @param {string} query - English medical question/symptoms description
//    * @returns {Promise<string>} - Generated English medical response
//    */
//   async generateReply(query) {
//     try {
//       const fullPrompt = `${this.systemPrompt}\n\nPatient/CHW Query: ${query}`;
//       const result = await this.chat.sendMessage(fullPrompt);
//       const response = await result.response;
//       return response.text();
//     } catch (e) {
//       return `Error generating response: ${e.message}`;
//     }
//   }

//   /**
//    * Simplify medical response for patient understanding
//    * @param {string} response - Original English medical response
//    * @returns {Promise<string>} - Simplified English version
//    */
//   async simplifyReply(response) {
//     try {
//       const simplificationPrompt = `Simplify this medical response for a patient:\n\n${response}\n\n
//       Guidelines:
//       1. Use simple language (8th grade level)
//       2. Focus on key actions
//       3. Explain medical terms
//       4. Keep under 300 words`;

//       const result = await this.chat.sendMessage(simplificationPrompt);
//       const simplified = await result.response;
//       return simplified.text();
//     } catch (e) {
//       return `Error simplifying response: ${e.message}`;
//     }
//   }
// }

// export default AgentPCP;




