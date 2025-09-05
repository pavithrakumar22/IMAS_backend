import express from "express";
import { mainGraph } from "./langgraph.js";

const router = express.Router();

router.post("/run", async (req, res) => {
  try {

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { text, src = "en", tgt = "en" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Field 'text' is required" });
    }

    const result = await mainGraph.invoke(
      { input: text, src, tgt },
      { asState: true }
    );

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ result });
  } catch (err) {
    console.error("Graph execution error:", err);
    return res.status(500).json({ error: "Graph execution failed", details: err.message });
  }
});

export default router;
