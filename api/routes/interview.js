import express from 'express';
import MedicalInterview from '../../Agents/Interview/interview.js';

const router = express.Router();

// Store active interviews
const activeInterviews = new Map();

// Helper to get or create interview session
function getInterviewSession(sessionId) {
  if (!activeInterviews.has(sessionId)) {
    activeInterviews.set(sessionId, new MedicalInterview());
  }
  return activeInterviews.get(sessionId);
}

// Clean up old sessions (optional)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [sessionId, interview] of activeInterviews.entries()) {
    // You could add timestamp tracking to interview objects
    // For now, we'll just keep all sessions
  }
}, 30 * 60 * 1000); // Clean every 30 minutes

// GET /api/interview/questions - Get all questions at once
router.get('/questions', async (req, res) => {
  try {
    const { sessionId = `session_${Date.now()}` } = req.query;
    
    const interview = getInterviewSession(sessionId);
    
    // Generate 3 questions with different contexts
    const questions = [];
    const contexts = [
      'fever and body ache in a rural village setting',
      'persistent cough in a child',
      'maternal health during early pregnancy',
      'management of diarrhoea in children',
      'malaria symptoms in monsoon season',
      'nutrition advice for underweight mothers',
      'wound care with limited resources',
      'high blood pressure in elderly rural patient',
      'basic antenatal care visit',
      'follow-up for tuberculosis treatment',
      'postpartum bleeding management',
      'skin infections during humid weather',
      'supporting patients with suspected dengue'
    ];

    // Select 3 unique random contexts
    const selectedContexts = [...contexts]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    for (let i = 0; i < 3; i++) {
      const question = await interview.generateQuestion(selectedContexts[i]);
      questions.push({
        questionId: i + 1,
        question: question,
        context: selectedContexts[i]
      });
    }

    res.json({
      success: true,
      sessionId: sessionId,
      questions: questions,
      message: '3 medical questions generated successfully'
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/interview/evaluate - Submit all answers and get evaluation
router.post('/evaluate', async (req, res) => {
  try {
    const { sessionId, answers } = req.body;

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Missing sessionId or answers array'
      });
    }

    if (answers.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Exactly 3 answers are required'
      });
    }

    const interview = activeInterviews.get(sessionId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview session not found. Please generate questions first.'
      });
    }

    // Evaluate all answers
    const evaluations = [];
    for (let i = 0; i < answers.length; i++) {
      interview.currentIndex = i;
      const evaluation = await interview.evaluateAnswer(answers[i]);
      evaluations.push({
        questionId: i + 1,
        question: evaluation.question,
        score: evaluation.score,
        feedback: evaluation.feedback
      });
    }

    // Generate final report and summary
    const report = interview.generateReport();
    const summary = interview.summary;

    // Clean up the session after evaluation
    activeInterviews.delete(sessionId);

    res.json({
      success: true,
      sessionId: sessionId,
      evaluations: evaluations,
      report: report,
      summary: {
        averageScore: summary.averageScore,
        competency: summary.competency,
        totalQuestions: summary.questionCount
      }
    });

  } catch (error) {
    console.error('Error evaluating answers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/interview/summary - Get current session summary
router.get('/summary', async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    const interview = activeInterviews.get(sessionId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview session not found'
      });
    }

    const summary = interview.summary;
    
    res.json({
      success: true,
      sessionId: sessionId,
      summary: summary
    });

  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;