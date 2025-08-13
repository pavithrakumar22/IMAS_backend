import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { loadEnv } from '../../loadEnv.js';
loadEnv();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

class MedicalInterview {
  constructor() {
    this.questions = [];
    this.answers = [];
    this.scores = [];
    this.feedbacks = [];
    this.currentIndex = 0;

    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      maxOutputTokens: 2048,
      apiKey: process.env.GOOGLE_API_KEY
    });
    
    this.SYSTEM_PROMPT = Object.freeze(`
      As a medical training AI for rural Indian healthcare providers, you must:
      
      1. QUESTION GENERATION RULES:
      - Focus on: infectious diseases, maternal/child health, chronic conditions
      - Include: patient history, vital signs, available resources
      - Format: "Patient presents with [symptoms]. What is your next step?"
      
      2. EVALUATION CRITERIA:
      A) Clinical Accuracy (40%):
      - Correct diagnosis/management
      - Appropriate medication choices
      
      B) Practicality (30%):
      - Feasible in resource-limited settings
      - Cost-effective solutions
      
      C) Safety (20%):
      - Red flags identified
      - Proper referral timing
      
      D) Communication (10%):
      - Clear, organized response
      
      3. RESPONSE FORMAT:
      Always return: "SCORE: X/10. FEEDBACK: [concise actionable feedback]"
    `);
  }

  generateResults() {
    if (this.scores.length === 0) {
      return {
        score: 0,
        tag: "No answers evaluated"
      };
    }

    const averageScore = this.scores.reduce((sum, score) => sum + score, 0) / this.scores.length;
    let tag;

    if (averageScore >= 9) {
      tag = "Excellent";
    } 
    else if (averageScore >= 7) {
      tag = "Good";
    } 
    else if (averageScore >= 5) {
      tag = "Fair";
    } 
    else {
      tag = "Poor";
    }

    return {
      score: averageScore.toFixed(1),
      tag
    };
  }

  generateReport() {
    return this.questions.map((question, index) => ({
      question,
      yourAnswer: this.answers[index] || "No answer provided",
      explanation: this.feedbacks[index] || "No feedback available",
      score: this.scores[index] || 0
    }));
  }

  async generateQuestion(context) {
    try {
      const messages = [
        new SystemMessage(this.SYSTEM_PROMPT),
        new HumanMessage(`
          Generate ONE clinical question about ${context} with:
          - Rural Indian patient scenario
          - 1-2 key symptoms/findings
          - Required: Ask for specific action
          - Easy level but not overly simplistic
          
          Return ONLY the question text.
        `)
      ];
      
      const response = await this.model.invoke(messages);
      const question = response.content.toString().trim();
      this.questions.push(question);
      return question;
      
    } catch (error) {
      console.error("Question generation failed:", error);
      return "A patient presents with fever and headache. What is your initial assessment?";
    }
  }

  async evaluateAnswer(answer) {
    const currentQuestion = this.questions[this.currentIndex];
    
    const messages = [
      new SystemMessage(this.SYSTEM_PROMPT),
      new HumanMessage(`
        Evaluate this RMP's response:
        QUESTION: ${currentQuestion}
        ANSWER: ${answer}
        
        Required:
        1. Score (1-10) using the criteria
        2. One specific improvement suggestion
        3. Safety consideration
        4. Use simple words that an RMP in rural India can understand.
        5. Evaluate in a simple manner
        6. Do not use complex medical jargon. Use clear, everyday terms.
        
        Respond in format: "SCORE: X/10. FEEDBACK: [concise actionable feedback]"
      `)
    ];
    
    try {
      const response = await this.model.invoke(messages);
      const evaluation = response.content.toString().trim();
      
      const [score, feedback] = this.#parseEvaluation(evaluation);
      
      this.answers.push(answer);
      this.scores.push(score);
      this.feedbacks.push(feedback);
      this.currentIndex++;
      
      return { score, feedback, question: currentQuestion };
      
    } catch (error) {
      console.error("Evaluation failed:", error);
      return { score: 5, feedback: "Evaluation unavailable", question: currentQuestion };
    }
  }

  #parseEvaluation(text) {
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/i);
    
    return [
      scoreMatch ? Math.min(10, Math.max(1, parseInt(scoreMatch[1]))) : 5,
      feedbackMatch?.[1]?.trim() || "No specific feedback"
    ];
  }

  get summary() {
    const average = this.scores.reduce((sum, score) => sum + score, 0) / this.scores.length;
    
    return {
      averageScore: average.toFixed(1),
      competency: this.#getCompetency(average),
      questionCount: this.questions.length,
      breakdown: this.questions.map((q, i) => ({
        question: q,
        answer: this.answers[i],
        score: this.scores[i],
        feedback: this.feedbacks[i]
      }))
    };
  }

  #getCompetency(score) {
    return score >= 9 ? "Expert" :
           score >= 7 ? "Proficient" :
           score >= 5 ? "Developing" : "Beginner";
  }
}

export default MedicalInterview;