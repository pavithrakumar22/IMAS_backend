import express from 'express';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import multer from 'multer';
import { complexityTool } from '../../Agents/complexity/complexity.js';
import LOWPCPAgent from '../../Agents/Low/PCPAgent.js';
import { loadEnv } from '../../loadEnv.js';
import { highComplexityTool } from '../../Agents/High/high.js';
import MCPAgent from '../../Agents/Medium/MCPAgent.js';
import { geminiCoordinator } from '../../Agents/Medium/geminiCoordinator.js';
import SimplifyAgent from '../../Agents/Simplification/simplify.js';
import emrRoutes from './emrRoutes.js';
import Guardrails from '../../Agents/Guardrails/guardrails.js';
import generateMedicalReport from '../../Agents/Report/reportgen.js';
import path from 'path';

loadEnv();

const router = express.Router();
const simplifier = new SimplifyAgent();
const guardrails = new Guardrails();

function formatResponse(originalText, translatedText, complexity, diagnosis, simplified = null, guardrailResults = {}) {
  return {
    original: originalText || null,
    translated: translatedText || null,
    complexity: {
      level: complexity?.complexity || "UNKNOWN",
      reason: complexity?.reason || "No explanation provided"
    },
    diagnosis: diagnosis || {},
    simplified: simplified || null,
    guardrails: guardrailResults
  };
}

async function classifyAndDiagnose(translatedText) {
  try {
    const complexityResultJson = await complexityTool.invoke(translatedText);
    let complexityResult;

    try {
      complexityResult = JSON.parse(complexityResultJson);
    }
    catch (err) {
      console.error("Failed to parse complexityTool response:", err);
      complexityResult = {
        complexity: "UNKNOWN",
        reason: "Failed to parse LLM response",
        rawResponse: complexityResultJson
      };
    }

    let diagnosisResult = null;
    let diagnosisGuardrail = null;

    console.log("Classified problem as: " + complexityResult.complexity);
    console.log("Generating Plan...");

    if (complexityResult.complexity === "LOW") {
      const apiKey = process.env.GEMINI_API_KEY;
      const lowAgent = new LOWPCPAgent(apiKey);
      try {
        diagnosisResult = await lowAgent.generateHealthPlan(translatedText);
        diagnosisGuardrail = await guardrails.evaluate(
          translatedText,
          diagnosisResult,
          'low-complexity-diagnosis'
        );
      }
      catch (err) {
        console.error("Failed to generate low complexity health plan:", err);
        diagnosisResult = { error: "Low complexity plan generation failed" };
      }
    }
    else if (complexityResult.complexity === "MEDIUM") {
      const apiKey = process.env.GEMINI_API_KEY;
      const mediumAgent = new MCPAgent(apiKey);
      try {
        const patientInfo = await geminiCoordinator.processPatientQuery(translatedText);
        const specialistResponses = await mediumAgent.getSpecialistResponses(
          translatedText,
          patientInfo.doctors.map(d => d.id)
        );
        diagnosisResult = {
          symptoms: patientInfo.symptoms || [],
          doctors: patientInfo.doctors || [],
          specialistResponses: specialistResponses || []
        };
        diagnosisGuardrail = await guardrails.evaluate(
          translatedText,
          diagnosisResult,
          'medium-complexity-diagnosis'
        );
      }
      catch (err) {
        console.error("Failed to generate medium complexity plan:", err);
        diagnosisResult = { error: "Medium complexity plan generation failed" };
      }
    }
    else if (complexityResult.complexity === "HIGH") {
      try {
        const highResult = await highComplexityTool.invoke(translatedText);
        diagnosisResult = JSON.parse(highResult);
        diagnosisGuardrail = await guardrails.evaluate(
          translatedText,
          diagnosisResult,
          'high-complexity-diagnosis'
        );
      }
      catch (err) {
        console.error("Failed to parse highComplexityTool response:", err);
        diagnosisResult = { error: "High complexity advice generation failed" };
      }
    }
    console.log("Plan Generated...");
    return { 
      complexity: complexityResult, 
      diagnosis: diagnosisResult,
      diagnosisGuardrail: diagnosisGuardrail
    };

  }
  catch (err) {
    console.error("Error in classifyAndDiagnose:", err);
    return {
      complexity: { complexity: "ERROR", reason: err.message },
      diagnosis: { error: "Internal processing error" },
      diagnosisGuardrail: null
    };
  }
}

async function simplifyText(text, audience = "general") {
  try {
    const result = await simplifier.simplifyResponse(text, audience);
    console.log('Simplify response:', JSON.stringify(result, null, 2));

    return result;
  }
  catch (err) {
    console.error("Error in simplifyText:", err);
    return {
      success: false,
      error: err.message,
      simplified: null
    };
  }
}

router.post('/translate-and-classify', async (req, res) => {
  try {
    const { text, src, tgt, simplify, audience } = req.body;

    if (!text || !src || !tgt) {
      return res.status(400).json({ 
        success: false,
        error: "Missing 'text', 'src', or 'tgt' in request body." 
      });
    }

    console.log('🔍 Starting translation and medical analysis...');

    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('src', src);
    formData.append('tgt', tgt);

    const flaskResponse = await axios.post('http://localhost:8000/ttt', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const translatedText = flaskResponse.data.output;
    console.log('✅ Translation completed');

    const translationGuardrail = await guardrails.evaluate(
      { text, src, tgt },
      { translation: translatedText },
      'translation-check'
    );
    console.log('✅ Translation guardrail check completed:', translationGuardrail.passed ? 'PASSED' : 'FAILED');

    const { complexity: detectedComplexity, diagnosis, diagnosisGuardrail } = await classifyAndDiagnose(translatedText);
    console.log('✅ Medical classification completed:', detectedComplexity.complexity);
    if (diagnosisGuardrail) {
      console.log('✅ Diagnosis guardrail check completed:', diagnosisGuardrail.passed ? 'PASSED' : 'FAILED');
    }

    let result;
    let simplificationGuardrail = null;

    if (simplify) {
      console.log('🔍 Starting simplification process...');
      
      const medicalData = {
        original: text,
        translated: translatedText,
        complexity: detectedComplexity,
        diagnosis: diagnosis
      };
      
      result = await simplifier.processMedicalData(medicalData, audience || "general");
      
      if (result.success && result.simplified) {
        simplificationGuardrail = await guardrails.evaluate(
          diagnosis,
          result.simplified,
          'simplification-check',
          { audience: audience || "general" }
        );
        console.log('✅ Simplification guardrail check completed:', simplificationGuardrail.passed ? 'PASSED' : 'FAILED');
      }
      
      console.log('✅ Simplification completed');
    } else {
      result = {
        success: true,
        original: text,
        translated: translatedText,
        complexity: detectedComplexity,
        diagnosis: diagnosis,
        timestamp: new Date().toISOString()
      };
    }

    result.guardrails = {
      translation: translationGuardrail,
      diagnosis: diagnosisGuardrail,
      simplification: simplificationGuardrail
    };

    console.log('✅ Final response ready');
    res.json(result);

  } catch (err) {
    console.error("❌ Error in translate-and-classify:", err);
    res.status(500).json({ 
      success: false,
      error: err.message,
      details: "Failed to process translation and classification request",
      timestamp: new Date().toISOString()
    });
  }
});

const upload = multer({ dest: 'uploads/' });

router.use('/api/emr', emrRoutes);

router.post('/stt-and-classify', upload.single('audio'), async (req, res) => {
  let audioFile;
  try {
    const { src, tgt, simplify, audience } = req.body;
    audioFile = req.file;

    if (!audioFile || !src || !tgt) {
      return res.status(400).json({ error: "Missing 'audio', 'src', or 'tgt'." });
    }

    const formData = new FormData();
    formData.append('audio', fs.createReadStream(audioFile.path), audioFile.originalname);
    formData.append('src', src);
    formData.append('tgt', tgt);

    const flaskResponse = await axios.post('http://localhost:8000/stt', formData, {
      headers: formData.getHeaders(),
    });

    const translatedText = flaskResponse.data.output;
    if (!translatedText) {
      throw new Error("STT + Translation service returned no output.");
    }

    const { complexity, diagnosis, diagnosisGuardrail } = await classifyAndDiagnose(translatedText);

    let simplifiedResult = null;
    let simplificationGuardrail = null;

    if (simplify) {
      const targetAudience = audience || "general";
      simplifiedResult = await simplifyText(JSON.stringify(diagnosis), targetAudience);
      
      if (simplifiedResult.success && simplifiedResult.simplified) {
        simplificationGuardrail = await guardrails.evaluate(
          diagnosis,
          simplifiedResult.simplified,
          'simplification-check',
          { audience: targetAudience }
        );
      }
    }

    const guardrailResults = {
      diagnosis: diagnosisGuardrail,
      simplification: simplificationGuardrail
    };

    res.json(formatResponse(null, translatedText, complexity, diagnosis, simplifiedResult, guardrailResults));

  }
  catch (err) {
    console.error("Error in /stt-and-classify:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
  finally {
    if (audioFile?.path) {
      fs.unlink(audioFile.path, (unlinkErr) => {
        if (unlinkErr) {
          console.warn("Failed to delete uploaded file:", unlinkErr);
        } else {
          console.log("Uploaded file deleted:", audioFile.path);
        }
      });
    }
  }
});

router.post('/simplify', async (req, res) => {
  try {
    const { text, audience = "general" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing 'text' in request body." });
    }

    const result = await simplifyText(text, audience);

    let guardrailResult = null;
    if (result.success && result.simplified) {
      guardrailResult = await guardrails.evaluate(
        text,
        result.simplified,
        'simplification-check',
        { audience }
      );
    }

    if (result.success) {
      res.json({
        success: true,
        original: text,
        simplified: result.simplified,
        audience: audience,
        guardrails: {
          simplification: guardrailResult
        }
      });
    }
    else {
      res.status(500).json({
        success: false,
        error: result.error,
        original: text
      });
    }

  }
  catch (err) {
    console.error("Error in /simplify:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error"
    });
  }
});


router.post('/report', async (req, res) => {
  try {
    const { diagnosisData, fileName } = req.body;
    if (!diagnosisData || typeof diagnosisData !== 'object') {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid 'diagnosisData' in request body."
      });
    }

    const pdfPath = await generateMedicalReport(diagnosisData, fileName || 'medical-report');
    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({ success: false, error: 'PDF generation failed.' });
    }

    res.download(pdfPath, path.basename(pdfPath), (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ success: false, error: 'Failed to download report.' });
      } else {
        console.log('Report downloaded:', pdfPath);
      }
    });
  } catch (error) {
    console.error('Error generating medical report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate PDF report'
    });
  }
});


export default router;