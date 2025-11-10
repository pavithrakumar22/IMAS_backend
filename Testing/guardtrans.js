//Translation Tests: 

import Guardrails from "../Agents/Guardrails/guardrails.js";

const guard = new Guardrails();

async function runTests() {
  const tests = [
    {
      name: "Telugu → English (Pass)",
      input: {
        text: "నేను ఈ రోజు మార్కెట్‌కి వెళ్లి కొన్ని పండ్లు కొనుగోలు చేశాను.",
        sourceLang: "tel",
        targetLang: "eng"
      },
      output: {
        translatedText: "I went to the market today and bought some fruits."
      },
      task: "translation-check",
      expected: "pass"
    },
    {
      name: "Spanish → English (Fail)",
      input: {
        text: "Ayer fui al supermercado para comprar algunas frutas frescas.",
        sourceLang: "spa",
        targetLang: "eng"
      },
      output: {
        translatedText: "Ayer fui al supermercado para comprar algunas frutas frescas."
      },
      task: "translation-check",
      expected: "fail"
    },
    {
      name: "Hindi → English (Nearly Correct)",
      input: {
        text: "आज मौसम बहुत सुहावना",
        sourceLang: "hin",
        targetLang: "eng"
      },
      output: {
        translatedText: "The weather is nice today and I feel like going out for a walk."
      },
      task: "translation-check",
      expected: "near-pass"
    }
  ];

  for (const test of tests) {
    const result = await guard.evaluate(test.input, test.output, test.task);
    console.log(`\n=== ${test.name} ===`);
    console.log("Expected :", test.expected.toUpperCase());
    console.log("Response :", result.passed ? "PASS" : "FAIL");
    console.log("Score    :", result.score);
  }
}

runTests();
