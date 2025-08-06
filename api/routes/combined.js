import express from 'express';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import multer from 'multer';
import { complexityTool } from '../../Agents/complexity/complexity.js';

const router = express.Router();

router.post('/translate-and-classify', async (req, res, next) => {
  try {
    const { text, src, tgt } = req.body;

    if (!text || !src || !tgt) {
      return res.status(400).json({ error: "Missing 'text', 'src', or 'tgt' in request body." });
    }

    
    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('src', src);
    formData.append('tgt', tgt);

    const flaskResponse = await axios.post('http://localhost:8000/ttt', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const translatedText = flaskResponse.data.output;

    if (!translatedText) {
      throw new Error("Translation service returned no output.");
    }

    const complexityResultJson = await complexityTool.invoke(translatedText);
    const complexityResult = JSON.parse(complexityResultJson);

    res.json({
      original: text,
      translated: translatedText,
      complexity: complexityResult
    });

  } catch (err) {
    console.error("Error in combined flow:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
const upload = multer({ dest: 'uploads/' });
router.post('/stt-and-classify', upload.single('audio'), async (req, res) => {
  try {
    const { src, tgt } = req.body;
    const audioFile = req.file;

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
    const complexityResultJson = await complexityTool.invoke(translatedText);
    const complexityResult = JSON.parse(complexityResultJson);

    fs.unlink(audioFile.path, (err) => {
      if (err) {
        console.warn("⚠️ Failed to delete uploaded file:", err);
      } else {
        console.log("🧹 Uploaded file deleted:", audioFile.path);
      }
    });


    res.json({
      translated: translatedText,
      complexity: complexityResult
    });

  } catch (err) {
    console.error("Error in combined flow:", err);
   
  }
  if (audioFile?.path) {
      fs.unlink(audioFile.path, (unlinkErr) => {
        if (unlinkErr) {
          console.warn("⚠️ Failed to delete uploaded file on error:", unlinkErr);
        }
      });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
});


export default router;



