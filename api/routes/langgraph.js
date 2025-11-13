import fetch from "node-fetch";
import { StateGraph, END } from "@langchain/langgraph";
import { complexityTool } from "../../Agents/complexity/complexity.js";
import { highComplexityTool } from "../../Agents/High/high.js";
import LOWPCPAgent from "../../Agents/Low/PCPAgent.js";
import MedicalAssistantAgent from "../../Agents/Medium/MCPAgent.js";
import SimplifyAgent from "../../Agents/Simplification/simplify.js";
import { loadEnv } from "../../loadEnv.js";

loadEnv();

const START = "__start__";

const lowAgent = new LOWPCPAgent(process.env.GOOGLE_API_KEY);
const mediumAgent = new MedicalAssistantAgent(process.env.GOOGLE_API_KEY);
const simplifyAgent = new SimplifyAgent();

async function TranslationModel(state) {
  try {
    console.log(">>> TranslationModel running");
    const res = await fetch("http://localhost:8000/ttt", {
      method: "POST",
      body: new URLSearchParams({
        text: state.input,
        src: state.src || "en",
        tgt: state.tgt || "hi"
      })
    });
    const data = await res.json();
    return { ...state, translated: data.output };
  } 
  catch (err) {
    return { ...state, error: "Translation failed: " + err.message };
  }
}

async function ComplexityModel(state) {
  if (state.error) return state;
  try {
    console.log(">>> ComplexityModel running");
    const result = await complexityTool.func(state.translated || state.input);
    const parsed = JSON.parse(result);
    return { ...state, complexity: parsed.complexity, complexityDetails: parsed };
  } 
  catch (err) {
    return { ...state, error: "Complexity detection failed: " + err.message };
  }
}

async function LowModel(state) {
  if (state.error) return state;
  try {
    console.log(">>> LowModel running");
    const res = await lowAgent.generateHealthPlan(state.translated || state.input);
    return { ...state, diagnosis: res };
  } 
  catch (err) {
    return { ...state, error: "LowModel failed: " + err.message };
  }
}

async function MediumModel(state) {
  if (state.error) return state;
  try {
    console.log(">>> MediumModel running");
    const res = await mediumAgent.getSpecialistResponses(
      state.translated || state.input,
      ["General Practitioner"]
    );
    return { ...state, diagnosis: res };
  } 
  catch (err) {
    return { ...state, error: "MediumModel failed: " + err.message };
  }
}

async function HighModel(state) {
  if (state.error) return state;
  try {
    console.log(">>> HighModel running");
    const result = await highComplexityTool.func(state.translated || state.input);
    return { ...state, diagnosis: JSON.parse(result) };
  } 
  catch (err) {
    return { ...state, error: "HighModel failed: " + err.message };
  }
}

async function SimplifyModel(state) {
  if (state.error) return state;
  try {
    console.log(">>> SimplifyModel running");
    
    const medicalData = {
      original: state.input,
      translated: state.translated,
      complexity: state.complexityDetails || state.complexity,
      diagnosis: state.diagnosis
    };
    
    const result = await simplifyAgent.processMedicalData(medicalData, "general");
    
    return { 
      ...state, 
      finalResult: result
    };
  } 
  catch (err) {
    return { ...state, error: "SimplifyModel failed: " + err.message };
  }
}

async function FailNode(state) {
  console.log(">>> FailNode: stopping graph due to error");
  return state;
}

const workflow = new StateGraph({
  channels: {
    input: null,
    src: null,
    tgt: null,
    translated: null,
    complexity: null,
    complexityDetails: null,
    diagnosis: null,
    finalResult: null,
    error: null
  }
})
  .addNode("TranslationModel", TranslationModel)
  .addNode("ComplexityModel", ComplexityModel)
  .addNode("LowModel", LowModel)
  .addNode("MediumModel", MediumModel)
  .addNode("HighModel", HighModel)
  .addNode("SimplifyModel", SimplifyModel)
  .addNode("FailNode", FailNode)
  .addEdge(START, "TranslationModel")
  .addConditionalEdges("TranslationModel", (state) =>
    state.error ? "FailNode" : "ComplexityModel"
  )
  .addConditionalEdges("ComplexityModel", (state) => {
    if (state.error) return "FailNode";
    if (state.complexity === "LOW") return "LowModel";
    if (state.complexity === "MEDIUM") return "MediumModel";
    if (state.complexity === "HIGH") return "HighModel";
    return END;
  })
  .addConditionalEdges("LowModel", (state) =>
    state.error ? "FailNode" : "SimplifyModel"
  )
  .addConditionalEdges("MediumModel", (state) =>
    state.error ? "FailNode" : "SimplifyModel"
  )
  .addConditionalEdges("HighModel", (state) =>
    state.error ? "FailNode" : "SimplifyModel"
  )
  .addEdge("SimplifyModel", END)
  .addEdge("FailNode", END);

export const mainGraph = workflow.compile();