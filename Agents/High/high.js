import { DynamicTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { loadEnv } from '../../loadEnv.js';
loadEnv();


const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY
});


const highComplexityTool = new DynamicTool({
  name: "high_complexity_classifier",
  description: "Suggests a specialist doctor for high complexity diseases and provides immediate action steps",
  func: async (input) => {
    try {
    let query;
    if (typeof input === 'string') {
        query = input;
    }
    else if (typeof input === 'object' && input !== null) {
        query = input.query || input.input || input.text || input.condition || JSON.stringify(input);
    }
    else {
        query = String(input);
    }

    query = query.trim();
    if (!query) {
        throw new Error("Empty medical query provided");
    }

    const prompt = `You are a medical expert. The following condition has been classified as HIGH complexity due to being a severe or life-threatening condition. 

    For the condition: "${query}"

    1. First determine if this is a medical emergency requiring immediate attention (like heart attack, stroke, severe trauma, etc.)
    2. Recommend the most appropriate specialist(s) to consult
    3. Provide brief immediate action steps if it's an emergency

    Follow this format exactly:
    {
        "isEmergency": [true/false],
        "specialist": "[Specialist Type]",
        "immediateActions": "[Brief action steps or 'None' if not emergency]",
        "note": "[Any important note]"
    }

    Example for "Heart Attack":
    {
        "isEmergency": true,
        "specialist": "Cardiologist",
        "immediateActions": "Call emergency services immediately. Chew aspirin if not allergic. Stay calm and sit down.",
        "note": "Time is critical for heart attacks"
    }

    Example for "Stage 3 Cancer":
    {
        "isEmergency": false,
        "specialist": "Oncologist",
        "immediateActions": "None",
        "note": "Schedule appointment with oncologist soon"
    }`;

    const response = await llm.invoke(prompt);

    let result = response.content.trim();

    result = result.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');

    let parsedResult;
    try {
        parsedResult = JSON.parse(result);
    }
    catch (e) {
        console.log(e);
        throw new Error("Invalid response format from AI");
    }

    if (!parsedResult.specialist || typeof parsedResult.isEmergency !== 'boolean') {
        throw new Error("Incomplete recommendation from AI");
    }

    parsedResult.condition = query;
    parsedResult.complexity = "HIGH";

    return JSON.stringify(parsedResult);

    }
    catch (error) {
    console.error("Error in high complexity classification:", error);

    return JSON.stringify({
        complexity: "HIGH",
        condition: typeof input === 'string' ? input : JSON.stringify(input),
        isEmergency: true,
        specialist: "Specialist Physician",
        immediateActions: "Seek immediate medical attention",
        note: "Error occurred during classification: " + error.message
    });
    }
  }
});

export { highComplexityTool };