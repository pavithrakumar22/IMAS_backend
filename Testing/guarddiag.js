import Guardrails from "../Agents/Guardrails/guardrails.js";

const guard = new Guardrails();

async function runTests() {
  const tests = [
    {
      name: "Low Complexity Fever Case - PASS",
      input: { original: "i have fever from past 2 days" },
      output: {
        translated: "I have had a fever for the past two days.",
        complexity: {
          complexity: "LOW",
          reason:
            "Fever for two days without additional concerning symptoms is a common ailment often manageable with home care and over-the-counter medications.",
          key_factors: [
            "Duration of fever (2 days)",
            "Absence of other severe symptoms mentioned"
          ],
          suggested_action:
            "Monitor symptoms, rest, stay hydrated, and consider over-the-counter fever reducers. Consult a healthcare professional if fever persists or worsens, or if new symptoms develop."
        },
        diagnosis: {
          metadata: { source: "LOWPCPAgent", language: "en" },
          input: { symptoms: "I have had a fever for the past two days.", type: "patient-reported" },
          recommendations: {
            condition: "Fever (likely viral infection)",
            precautions: [
              "Stay home to rest and avoid spreading germs",
              "Wash hands frequently with soap and water",
              "Avoid close contact with others"
            ],
            diet: {
              recommended: [
                "Plenty of clear fluids",
                "Soft, easy-to-digest foods",
                "Fruits and vegetables"
              ],
              avoid: ["Heavy, fatty, or spicy foods", "Alcohol", "Caffeinated drinks"]
            },
            medications: ["Acetaminophen or Ibuprofen as per instructions"],
            natural_remedies: ["Take lukewarm sponge bath", "Drink ginger tea", "Rest"],
            activity: "Get plenty of rest",
            follow_up: { when: "If fever persists or new symptoms appear" },
            advice: ["Monitor temperature regularly"]
          },
          provider_notes: {
            chw_instructions: "All recommendations can be implemented by Community Health Worker",
            monitoring_guidance: "Monitor for worsening symptoms"
          }
        }
      },
      task: "low-complexity-diagnosis",
      expected: "PASS"
    },
    {
      name: "Low Complexity Fever Case - FAIL",
      input: { original: "i have fever from past 2 days" },
      output: {
        translated: "I have fever since two days.",
        complexity: { complexity: "LOW" },
        diagnosis: { recommendations: { condition: "Fever" } }
      },
      task: "low-complexity-diagnosis",
      expected: "FAIL"
    },
    {
        name: "Low Complexity Fever Case - NEAR-PASS",
        input: { original: "i have fever from past 2 days and mild headache" },
        output: {
            translated: "I have had a fever for the past two days with a mild headache.",
            complexity: {
            complexity: "LOW",
            reason: "Fever with mild headache is usually manageable at home, but key details like monitoring for worsening symptoms are missing.",
            key_factors: ["Duration of fever", "Presence of mild headache"],
            suggested_action: "Rest and hydrate; take over-the-counter fever/pain medication if needed"
            },
            diagnosis: {
            metadata: { source: "LOWPCPAgent", language: "en" },
            input: { symptoms: "Fever and mild headache for two days", type: "patient-reported" },
            recommendations: {
                condition: "Fever with mild headache",
                precautions: ["Rest", "Hydrate occasionally"],
                diet: { recommended: ["Fluids"], avoid: [] },
                medications: ["Acetaminophen if needed"]
            }
            }
        },
        task: "low-complexity-diagnosis",
        expected: "NEAR-PASS"
    }

  ];

  for (const test of tests) {
    const result = await guard.evaluate(test.input, test.output, test.task);
    let responseLabel = result.passed ? "PASS" : "FAIL"

    console.log(`\n=== ${test.name} ===`);
    console.log("Task     :", test.task);
    console.log("Expected :", test.expected);
    console.log("Response :", responseLabel);
    console.log("Score    :", result.score);
  }
}

runTests();