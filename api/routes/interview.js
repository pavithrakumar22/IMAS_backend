import express from 'express';
import MedicalInterview from '../../Agents/Interview/interview.js';

const router = express.Router();

const activeInterviews = new Map();

function getInterviewSession(sessionId) {
  if (!activeInterviews.has(sessionId)) {
    activeInterviews.set(sessionId, new MedicalInterview());
  }
  return activeInterviews.get(sessionId);
}

router.get('/questions', async (req, res) => {
  try {
    const { sessionId = `session_${Date.now()}` } = req.query;
    
    const interview = getInterviewSession(sessionId);
    
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

    const report = interview.generateReport();
    const summary = interview.summary;

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