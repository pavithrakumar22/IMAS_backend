import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export default class LOWPCPAgent {
  constructor(apiKey) {
    this.llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: apiKey,
      maxOutputTokens: 2048,
      temperature: 0.5
    });
    this.cachedResponse = null;
  }

  async generateHealthPlan(symptoms) {
    if (!this.cachedResponse) {
      const professionalPrompt = `For the symptoms "${symptoms}", provide medical guidance in STRICT JSON format with these exact keys:
      {
        "condition": "Brief identification of likely condition",
        "precautions": ["point1", "point2"],
        "diet": {
          "recommended": ["item1", "item2", "item3"],
          "avoid": ["item1", "item2"]
        },
        "medications": ["option1", "option2"],
        "natural_remedies": ["home remedy 1", "home remedy 2"],
        "activity": "recommendation",
        "follow_up": {
          "when": "when to seek help",
          "criteria": ["symptom1", "symptom2"]
        },
        "advice": ["tip1", "tip2", "tip3"],
        "complexity": "LOW",
        "rationale": "Why this is low complexity care"
      }

      Important:
      - Return ONLY the raw JSON without any additional text
      - Include simple and safe home-based natural remedies where relevant
      - Keep recommendations simple enough for a Community Health Worker to explain
      - Focus on OTC treatments, natural remedies, and home care
      - Use plain language but maintain medical accuracy

      ### Example:
      If the symptoms were "Mild headache and tiredness", the response should look like:
      {
        "condition": "Tension headache",
        "precautions": ["Stay hydrated", "Avoid excessive screen time"],
        "diet": {
          "recommended": ["Fresh fruits", "Whole grains", "Plenty of water"],
          "avoid": ["Caffeinated drinks", "Alcohol"]
        },
        "medications": ["Acetaminophen (OTC)", "Ibuprofen (OTC)"],
        "natural_remedies": ["Apply a warm compress on neck", "Drink ginger tea"],
        "activity": "Light activity and short rest breaks",
        "follow_up": {
          "when": "If pain persists for more than 3 days or worsens",
          "criteria": ["Severe pain", "Vision changes"]
        },
        "advice": ["Get enough sleep", "Reduce stress", "Practice relaxation exercises"],
        "complexity": "LOW",
        "rationale": "Condition can be managed with OTC medications and simple lifestyle changes"
      }`;

      const professionalResponse = await this._generateResponse(professionalPrompt);

      this.cachedResponse = this._formatResponse(
        this._parseResponse(professionalResponse),
        symptoms
      );
    }

    return this.cachedResponse;
  }

  _parseResponse(response) {
    try {
      if (typeof response === "object") return response;

      const stringContent = typeof response === "string" ? response : JSON.stringify(response);

      const jsonMatch = stringContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
      const cleaned = jsonMatch ? jsonMatch[1].trim() : stringContent.trim();

      const parsed = JSON.parse(cleaned);

      if (!parsed.condition || !parsed.precautions) {
        throw new Error("Invalid response structure");
      }

      return parsed;
    } catch (e) {
      console.error("Failed to parse response:", e);
      return this._getFallbackResponse();
    }
  }

  _formatResponse(parsedResponse, symptoms) {
    return {
      metadata: {
        source: "LOWPCPAgent",
        language: "en"
      },
      input: {
        symptoms: symptoms,
        type: "patient-reported"
      },
      recommendations: {
        condition: parsedResponse.condition,
        precautions: parsedResponse.precautions,
        diet: parsedResponse.diet,
        medications: parsedResponse.medications,
        natural_remedies: parsedResponse.natural_remedies,
        activity: parsedResponse.activity,
        follow_up: parsedResponse.follow_up,
        advice: parsedResponse.advice
      },
      provider_notes: {
        chw_instructions: "All recommendations can be implemented by Community Health Worker",
        monitoring_guidance: "Monitor for worsening symptoms listed in follow_up criteria"
      }
    };
  }

  _getFallbackResponse() {
    return {
      condition: "Unspecified minor condition",
      precautions: ["Practice good hygiene", "Get adequate rest"],
      diet: {
        recommended: ["Clear fluids", "Bland foods"],
        avoid: ["Alcohol", "Spicy foods"]
      },
      medications: ["OTC pain relievers as needed"],
      natural_remedies: ["Drink warm herbal tea", "Apply warm compress"],
      activity: "Light activity as tolerated",
      follow_up: {
        when: "If symptoms worsen or persist beyond 3 days",
        criteria: ["Fever over 101°F", "Difficulty breathing"]
      },
      advice: ["Stay hydrated", "Monitor symptoms"],
      complexity: "LOW",
      rationale: "Default low complexity response"
    };
  }

  async _generateResponse(prompt) {
    try {
      const response = await this.llm.invoke(prompt);
      const rawText = response.content; 
      return rawText;
    } catch (e) {
      console.error("API Error:", e.message);
      return JSON.stringify(this._getFallbackResponse());
    }
  }

  clearCache() {
    this.cachedResponse = null;
  }
}