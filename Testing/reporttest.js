import { generateMedicalReport } from '..//Agents/Report/reportgen.js';

const lowComplexityData = {
    "success": true,
    "original": "i have fever from past 3 days and body pains along with cold and cough",
    "translated": "I have had a fever for the past three days and body pains along with cold and cough.",
    "complexity": {
        "complexity": "LOW",
        "reason": "The symptoms described (fever for three days, body pains, cold, and cough) are typical of a common viral infection like a cold or flu, which can often be managed with rest, hydration, and over-the-counter medications. A Community Health Worker (CHW) can provide guidance on these basic interventions and advise on when to seek further medical attention if symptoms persist or worsen.",
        "key_factors": [
            "Fever for three days",
            "Body pains",
            "Cold and cough"
        ],
        "suggested_action": "Rest, stay hydrated, use over-the-counter pain and fever relievers (e.g., acetaminophen, ibuprofen), and monitor symptoms. If symptoms worsen, a high fever persists, or new concerning symptoms develop, consult a healthcare provider."
    },
    "diagnosis": {
        "metadata": {
            "source": "LOWPCPAgent",
            "language": "en"
        },
        "input": {
            "symptoms": "I have had a fever for the past three days and body pains along with cold and cough.",
            "type": "patient-reported"
        },
        "recommendations": {
            "condition": "Common Cold or Flu-like illness (Viral Respiratory Infection)",
            "precautions": [
                "Rest adequately to aid recovery",
                "Stay well-hydrated by drinking plenty of fluids",
                "Avoid close contact with others to prevent spreading the illness",
                "Cover your mouth and nose when coughing or sneezing"
            ],
            "diet": {
                "recommended": [
                    "Warm fluids (water, clear broths, herbal tea with honey)",
                    "Soft, easy-to-digest foods (soups, porridge, mashed fruits)",
                    "Fruits and vegetables rich in Vitamin C (citrus fruits, berries)"
                ],
                "avoid": [
                    "Spicy or oily/fried foods",
                    "Alcohol and caffeinated drinks (can cause dehydration)",
                    "Sugary drinks and processed foods"
                ]
            },
            "medications": [
                "Acetaminophen (for fever and body pains)",
                "Ibuprofen (for fever and body pains)",
                "Over-the-counter cough syrup (for cough relief)"
            ],
            "natural_remedies": [
                "Gargle with warm salt water (for sore throat)",
                "Inhale steam from a bowl of hot water or a humidifier (for congestion and cough)",
                "Drink ginger-honey tea (for cough and soothing throat)"
            ],
            "activity": "Rest and limit strenuous physical activities",
            "follow_up": {
                "when": "If symptoms worsen, new symptoms appear, or do not improve after 5-7 days",
                "criteria": [
                    "High fever (above 102°F or 39°C) that doesn't respond to medication",
                    "Difficulty breathing or shortness of breath",
                    "Severe chest pain or persistent headache",
                    "Worsening cough or production of colored phlegm",
                    "Signs of dehydration (e.g., reduced urination, extreme thirst)"
                ]
            },
            "advice": [
                "Wash hands frequently with soap and water",
                "Avoid touching your face, especially eyes, nose, and mouth",
                "Ensure good ventilation in your living spaces",
                "Get plenty of quality sleep to support your immune system"
            ]
        },
        "provider_notes": {
            "chw_instructions": "All recommendations can be implemented by Community Health Worker",
            "monitoring_guidance": "Monitor for worsening symptoms listed in follow_up criteria"
        }
    },
    "simplified": {
        "simplified": "(simple conversational version):\n\nHey there! So sorry to hear you've been feeling under the weather with that fever, body pains, cold, and cough for the past three days. It sounds like you've probably caught a common cold or a flu-like bug, which is a viral infection that often goes around.\n\nThe good news is that these usually get better on their own with some good self-care! Here’s what you can do to feel better and get back on your feet:\n\n**What to do now:**\n\n*   **Rest, rest, rest!** Your body needs lots of sleep and downtime to fight this off.\n*   **Drink up!** Stay well-hydrated with plenty of fluids like water, clear broths, or herbal teas. Warm drinks can be especially soothing.\n*   **Eat gently:** Stick to soft, easy-to-digest foods like soups, porridge, or mashed fruits. Foods rich in Vitamin C, like oranges or berries, can also be helpful. Try to avoid anything spicy, greasy, fried, or overly sugary. Also, skip alcohol and too much caffeine, as they can make you more dehydrated.\n*   **For aches and fever:** You can take over-the-counter pain relievers like Acetaminophen (Tylenol) or Ibuprofen (Advil/Motrin) to help with your fever and body pains.\n*   **For your cough:** A regular over-the-counter cough syrup can offer some relief.\n*   **Natural soothers:** If you have a sore throat, gargling with warm salt water can really help. For stuffiness and cough, inhaling steam from a bowl of hot water (carefully!) or using a humidifier can make a big difference. A warm ginger-honey tea is also lovely for a cough and soothing your throat.\n*   **Take it easy:** Avoid any strenuous activities and just let your body focus on healing.\n\n**Help prevent spreading it:**\n\n*   Try to keep a little distance from others so you don't pass it on.\n*   Always cover your mouth and nose when you cough or sneeze, ideally into your elbow or a tissue.\n*   Wash your hands frequently with soap and water.\n*   Try not to touch your face, especially your eyes, nose, and mouth.\n*   Make sure your living spaces have some fresh air circulating.\n\n**When to get more help:**\n\nWhile you should start feeling better soon, it’s really important to keep an eye on your symptoms. If you don't start to feel better after about 5 to 7 days, if your symptoms get worse, or if you develop any new concerns, it's a good idea to chat with a doctor or healthcare provider.\n\n**Definitely reach out for medical help immediately if you experience any of these:**\n\n*   A really high fever (above 102°F or 39°C) that doesn't come down with medication.\n*   Trouble breathing or feeling short of breath.\n*   Severe chest pain or a really bad, persistent headache.\n*   Your cough gets much worse, or you start coughing up colored phlegm.\n*   Signs of dehydration, like not peeing much or feeling extremely thirsty.\n\nHang in there! Focus on resting, staying hydrated, and taking care of yourself. Hope you feel much better very soon!\n\n---\n\n#",
        "simplifiedMarkdown": "(formatted for easy reading):\n\n# Feeling Under the Weather? Here's What You Need to Know!\n\nHi there! It sounds like you've been having a tough time with a fever, body pains, cold, and cough for the past three days. Based on your symptoms, it sounds like you've likely caught a **common cold or a flu-like bug (a viral respiratory infection)**. Don't worry, these usually get better on their own with some good self-care!\n\nHere's a friendly guide to help you feel better and get back on your feet:\n\n## What You Can Do Right Now:\n\n### 1. **Rest & Hydration are Key!**\n*   **Get plenty of rest:** Your body needs lots of sleep and downtime to fight off the infection.\n*   **Stay well-hydrated:** Drink lots of fluids! Think water, clear broths, and herbal tea (honey can be soothing!). Warm drinks are especially comforting.\n\n### 2. **Eat Smart & Gently:**\n*   **Recommended foods:**\n    *   **Warm fluids:** Water, clear broths, herbal tea with honey.\n    *   **Soft, easy-to-digest foods:** Soups, porridge, mashed fruits.\n    *   **Vitamin C-rich fruits & veggies:** Citrus fruits, berries.\n*   **Foods to avoid:**\n    *   **Spicy, oily, or fried foods**\n    *   **Alcohol and caffeinated drinks:** These can lead to dehydration.\n    *   **Sugary drinks and processed foods**\n\n### 3. **Over-the-Counter Helpers:**\n*   **For fever & body pains:** You can take **Acetaminophen** (like Tylenol) or **Ibuprofen** (like Advil/Motrin). Follow the package directions for dosage.\n*   **For cough relief:** An **over-the-counter cough syrup** can help soothe your cough.\n\n### 4. **Natural Soothers:**\n*   **Sore throat:** **Gargle with warm salt water.**\n*   **Congestion & cough:** **Inhale steam** from a bowl of hot water (be careful!) or use a humidifier.\n*   **Soothing tea:** Drink **ginger-honey tea** for cough and throat comfort.\n\n### 5. **Take it Easy:**\n*   **Limit strenuous activities:** Give your body a break and avoid heavy exercise.\n\n## Help Prevent Spreading the Illness:\n\n*   **Avoid close contact** with others while you're feeling sick.\n*   **Cover your mouth and nose** when coughing or sneezing (use a tissue or your elbow).\n*   **Wash your hands frequently** with soap and water.\n*   **Avoid touching your face**, especially your eyes, nose, and mouth.\n*   **Ensure good ventilation** in your living spaces (open a window if you can!).\n*   **Get plenty of quality sleep** to support your immune system.\n\n## When to Seek Medical Help:\n\nMost colds and flu-like illnesses get better on their own. However, it's really important to know when to reach out to a doctor or healthcare provider.\n\n**Please contact a healthcare professional if:**\n\n*   Your symptoms **worsen**, you develop **new symptoms**, or you **do not improve after 5-7 days**.\n\n**Definitely seek medical help immediately if you experience any of these more serious signs:**\n\n*   **High fever** (above 102°F or 39°C) that doesn't respond to",
        "originalDiagnosisMarkdown": "# Medical Diagnosis Report\n\n## Patient Information\nPatient presents with a chief complaint of fever for the past three days, accompanied by body pains, cold, and cough.\n\n## Clinical Assessment\nBased on the patient's reported symptoms, the clinical assessment indicates a **Common Cold or Flu-like illness**, which is a **Viral Respiratory Infection**. The patient's presentation aligns with typical symptoms associated with such a condition.\n\n## Diagnostic Findings\n*   **Presenting Symptoms**:\n    *   Fever (duration: 3 days)\n    *   Body pains\n    *   Cold symptoms\n    *   Cough\n*   **Likely Condition**: Common Cold or Flu-like illness (Viral Respiratory Infection)\n\n## Treatment Recommendations\n### Medications\n*   **Acetaminophen**: For fever and body pains.\n*   **Ibuprofen**: For fever and body pains.\n*   **Over-the-counter cough syrup**: For cough relief.\n\n### Natural Remedies\n*   Gargle with warm salt water for sore throat relief.\n*   Inhale steam from a bowl of hot water or a humidifier to alleviate congestion and cough.\n*   Drink ginger-honey tea for cough and soothing the throat.\n\n### Precautions\n*   Rest adequately to support recovery.\n*   Stay well-hydrated by drinking plenty of fluids.\n*   Avoid close contact with others to prevent the spread of illness.\n*   Cover mouth and nose when coughing or sneezing.\n\n### Dietary Recommendations\n*   **Recommended**:\n    *   Warm fluids (e.g., water, clear broths, herbal tea with honey).\n    *   Soft, easy-to-digest foods (e.g., soups, porridge, mashed fruits).\n    *   Fruits and vegetables rich in **Vitamin C** (e.g., citrus fruits, berries).\n*   **Avoid**:\n    *   Spicy or oily/fried foods.\n    *   Alcohol and caffeinated drinks (can contribute to dehydration).\n    *   Sugary drinks and processed foods.\n\n### Activity\n*   Rest and limit strenuous physical activities.\n\n### General Advice\n*   Wash hands frequently with soap and water.\n*   Avoid touching your face, especially eyes, nose, and mouth.\n*   Ensure good ventilation in your living spaces.\n*   Prioritize quality sleep to support the immune system.\n\n## Follow-up Guidance\n### When to Seek Further Care\n*   If symptoms worsen, new symptoms appear, or do not show improvement after 5-7 days.\n\n### Warning Signs (Criteria for Urgent Consultation)\n*   High fever (above **102°F** or **39°C**) that does not respond to medication.\n*   Difficulty breathing or shortness of breath.\n*   Severe chest pain or persistent headache.\n*   Worsening cough or production of colored phlegm.\n*   Signs of dehydration (e.g., reduced urination, extreme thirst)."
    },
    "timestamp": "2025-11-11T10:01:14.341Z",
    "guardrails": {
        "translation": {
            "score": 10,
            "passed": true
        },
        "diagnosis": {
            "score": 9.8,
            "passed": true
        },
        "simplification": {
            "score": 9.8,
            "passed": true
        }
    }
}

const mediumComplexityData = {
  original: "I have chest discomfort and shortness of breath when climbing stairs",
  translated: "I have chest discomfort and shortness of breath when climbing stairs",
  timestamp: new Date().toISOString(),
  complexity: {
    complexity: "MEDIUM",
    reason: "Symptoms require professional evaluation to rule out cardiac issues",
    key_factors: ["Chest discomfort", "Exertional dyspnea", "Requires specialist assessment"],
    suggested_action: "Consult healthcare provider within 24-48 hours"
  },
  diagnosis: {
    symptoms: ["chest discomfort", "shortness of breath", "exertional symptoms"],
    doctors: [
      { id: "cardiologist", confidence: 0.85 },
      { id: "pulmonologist", confidence: 0.65 }
    ],
    specialistResponses: {
      cardiologist: JSON.stringify({
        for_patient: {
          condition_explanation: "Chest discomfort with shortness of breath during physical activity could indicate several conditions ranging from angina (reduced blood flow to the heart) to anxiety or musculoskeletal issues. It's important to get this evaluated to rule out serious cardiac conditions.",
          home_care: [
            "Avoid strenuous physical activity until evaluated by a doctor",
            "Monitor and note when symptoms occur (timing, duration, severity)",
            "Rest when experiencing symptoms",
            "Keep a list of all medications you're currently taking"
          ],
          warning_signs: [
            "Chest pain that spreads to jaw, neck, arms, or back",
            "Severe shortness of breath at rest",
            "Chest pain lasting more than 5 minutes",
            "Dizziness, lightheadedness, or fainting",
            "Rapid or irregular heartbeat",
            "Cold sweats or nausea with chest discomfort"
          ],
          when_to_seek_help: "Seek immediate emergency care (call 911) if you experience severe chest pain, extreme shortness of breath, or any of the warning signs listed above. Schedule an appointment with your primary care doctor or cardiologist within 24-48 hours for evaluation."
        },
        for_professional: {
          possible_causes: [
            "Stable angina pectoris",
            "Coronary artery disease (CAD)",
            "Anxiety or panic disorder",
            "Costochondritis",
            "Gastroesophageal reflux disease (GERD)",
            "Deconditioning"
          ],
          possible_medications: [
            {
              name: "Aspirin",
              dose: "81-325mg daily",
              duration: "Ongoing (if cardiac cause suspected)",
              cautions: ["Contraindicated in active bleeding", "Use with caution in peptic ulcer disease", "Monitor for bleeding"]
            },
            {
              name: "Sublingual Nitroglycerin",
              dose: "0.4mg as needed",
              duration: "For acute episodes",
              cautions: ["May cause headache and hypotension", "Do not use with phosphodiesterase inhibitors", "Seek emergency care if pain persists after 3 doses"]
            }
          ],
          tests_if_needed: [
            "Electrocardiogram (ECG/EKG)",
            "Stress test (exercise or pharmacological)",
            "Echocardiogram",
            "Chest X-ray",
            "Cardiac biomarkers (Troponin, BNP)",
            "Lipid panel",
            "Complete blood count (CBC)"
          ],
          referral_criteria: [
            "Positive cardiac biomarkers",
            "Abnormal ECG findings",
            "Positive stress test",
            "Risk factors: hypertension, diabetes, smoking, family history",
            "Age >40 with new-onset exertional chest discomfort",
            "Symptoms progressing in frequency or severity"
          ]
        }
      })
    }
  }
};

async function runTests() {
  console.log('Starting PDF Report Generation Tests...\n');

  try {
    console.log('Test 1: Generating LOW complexity report...');
    const lowPath = await generateMedicalReport(lowComplexityData, 'test-low');
    console.log(`✓ Low complexity report generated: ${lowPath}\n`);

    console.log('Test 2: Generating MEDIUM complexity report...');
    const mediumPath = await generateMedicalReport(mediumComplexityData, 'test-medium');
    console.log(`✓ Medium complexity report generated: ${mediumPath}\n`);

    console.log('All tests completed successfully!');
    console.log('\nGenerated files:');
    console.log(`- ${lowPath}`);
    console.log(`- ${mediumPath}`);

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

runTests();