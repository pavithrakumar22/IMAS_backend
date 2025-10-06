import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadEnv } from "../../loadEnv.js";

loadEnv();

class SimplifyAgent {
    constructor() {
        console.log('🔧 Initializing SimplifyAgent with API key:', 
                   process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
        
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            generationConfig: {
                temperature: 0.2,
                topP: 0.8,
                maxOutputTokens: 1024,
            }
        });
    }

    async simplifyResponse(complexResponse, targetAudience = "general") {
        try {
            const prompt = this._createPrompt(complexResponse, targetAudience);
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const simplifiedText = response.text();
            
            return {
                success: true,
                simplified: simplifiedText,
                targetAudience: targetAudience
            };
        } 
        catch (error) {
            console.error("Simplification error:", error);
            return {
                success: false,
                error: error.message,
                original: complexResponse
            };
        }
    }

    _createPrompt(complexResponse, targetAudience) {
        const audienceSpecificInstructions = {
            "general": "Explain this in simple, everyday language that anyone can understand. Use analogies and avoid medical jargon.",
            "technical": "Simplify this technical content while maintaining accuracy for healthcare professionals. Keep essential medical terms but explain complex concepts.",
            "executive": "Create a concise summary suitable for hospital administrators or insurance providers. Focus on key points and implications.",
            "student": "Explain this in educational terms suitable for medical students. Break down complex concepts into understandable parts."
        };

        const instruction = audienceSpecificInstructions[targetAudience] || 
                           audienceSpecificInstructions["general"];

        return `
        You are a medical response simplification expert. Your task is to make complex medical or technical healthcare content more accessible.

        ${instruction}.

        Original medical diagnosis:
        "${complexResponse}"

        Please provide a simplified version that:
        1. Maintains medical accuracy and core meaning
        2. Uses clear, simple language appropriate for ${targetAudience}
        3. Explains medical jargon in plain terms when necessary
        4. Is well-structured and easy to follow
        5. Preserves important medical information but makes it understandable

        Simplified version:
        `;
    }

    async batchSimplify(responses, targetAudience = "general") {
        const results = [];
        
        for (const response of responses) {
            const result = await this.simplifyResponse(response, targetAudience);
            results.push(result);
        }
        
        return results;
    }
}

export default SimplifyAgent;