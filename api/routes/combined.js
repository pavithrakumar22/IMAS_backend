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

loadEnv();

const router = express.Router();

const simplifier = new SimplifyAgent();

function formatResponse(originalText, translatedText, complexity, diagnosis, simplified = null) {
  return {
    original: originalText || null,
    translated: translatedText || null,
    complexity: {
      level: complexity?.complexity || "UNKNOWN",
      reason: complexity?.reason || "No explanation provided"
    },
    diagnosis: diagnosis || {},
    simplified: simplified || null
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

    if (complexityResult.complexity === "LOW") {
      const apiKey = process.env.GEMINI_API_KEY;
      const lowAgent = new LOWPCPAgent(apiKey);
      try {
        diagnosisResult = await lowAgent.generateHealthPlan(translatedText);
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
      }
      catch (err) {
        console.error("Failed to parse highComplexityTool response:", err);
        diagnosisResult = { error: "High complexity advice generation failed" };
      }
    }

    return { complexity: complexityResult, diagnosis: diagnosisResult };

  }
  catch (err) {
    console.error("Error in classifyAndDiagnose:", err);
    return {
      complexity: { complexity: "ERROR", reason: err.message },
      diagnosis: { error: "Internal processing error" }
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

    // Step 1: Translate the text
    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('src', src);
    formData.append('tgt', tgt);

    const flaskResponse = await axios.post('http://localhost:8000/ttt', formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const translatedText = flaskResponse.data.output;
    console.log('✅ Translation completed');

    // Step 2: Classify complexity and get diagnosis
    const { complexity: detectedComplexity, diagnosis } = await classifyAndDiagnose(translatedText);
    console.log('✅ Medical classification completed:', detectedComplexity.complexity);

    let result;
    if (simplify) {
      console.log('🔍 Starting simplification process...');
      
      const medicalData = {
        original: text,
        translated: translatedText,
        complexity: detectedComplexity,
        diagnosis: diagnosis
      };
      
      result = await simplifier.processMedicalData(medicalData, audience || "general");
      
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

    const { complexity, diagnosis } = await classifyAndDiagnose(translatedText);


    let simplifiedResult = null;
    if (simplify) {
      const targetAudience = audience || "general";
      simplifiedResult = await simplifyText(translatedText, targetAudience);
    }

    res.json(formatResponse(null, translatedText, complexity, diagnosis, simplifiedResult));

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

    if (result.success) {
      res.json({
        success: true,
        original: text,
        simplified: result.simplified,
        audience: audience
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

export default router;
