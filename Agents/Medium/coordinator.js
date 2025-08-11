// const specialists = {
//   'gen_surgeon': {
//     keywords: ['abdominal pain', 'appendicitis', 'hernia', 'gallbladder', 'trauma', 'surgical', 'tumor excision'],
//     description: 'General Surgeon'
//   },
//   'gastroenterologist': {
//     keywords: ['stomach pain', 'acid reflux', 'GERD', 'ulcer', 'crohn\'s', 'colitis', 'IBS', 'diarrhea', 'constipation', 'endoscopy'],
//     description: 'Gastroenterologist'
//   },
//   'cardiologist': {
//     keywords: ['chest pain', 'palpitations', 'shortness of breath', 'hypertension', 'arrhythmia', 'heart failure', 'ECG', 'echocardiogram'],
//     description: 'Cardiologist'
//   },
//   'endocrinologist': {
//     keywords: ['diabetes', 'thyroid', 'hormone imbalance', 'pituitary', 'adrenal', 'osteoporosis', 'metabolic disorder'],
//     description: 'Endocrinologist'
//   },
//   'dietitian': {
//     keywords: ['nutrition', 'diet', 'weight loss', 'weight gain', 'malnutrition', 'eating disorder', 'food intolerance'],
//     description: 'Dietitian'
//   },
//   'infectious_disease_specialist': {
//     keywords: ['fever', 'infection', 'sepsis', 'HIV', 'hepatitis', 'tuberculosis', 'antibiotics', 'viral', 'bacterial'],
//     description: 'Infectious Disease Specialist'
//   },
//   'dermatologist': {
//     keywords: ['rash', 'eczema', 'psoriasis', 'acne', 'skin lesion', 'mole', 'dermatitis', 'fungal infection'],
//     description: 'Dermatologist'
//   },
//   'neurologist': {
//     keywords: ['headache', 'migraine', 'seizure', 'stroke', 'numbness', 'tingling', 'parkinson\'s', 'alzheimer\'s', 'multiple sclerosis'],
//     description: 'Neurologist'
//   },
//   'pulmonologist': {
//     keywords: ['cough', 'asthma', 'COPD', 'pneumonia', 'lung cancer', 'bronchitis', 'shortness of breath', 'sleep apnea'],
//     description: 'Pulmonologist'
//   },
//   'orthopedist': {
//     keywords: ['joint pain', 'fracture', 'arthritis', 'back pain', 'spine', 'sports injury', 'tendonitis', 'bursitis'],
//     description: 'Orthopedist'
//   }
// };

// /**
//  * Determines which specialists are needed based on symptoms
//  * @param {string[]} symptoms - Array of symptoms
//  * @returns {string[]} Array of specialist keys needed
//  */
// export function determineSpecialists(symptoms) {
//   const neededSpecialists = new Set();
//   const symptomText = symptoms.join(' ').toLowerCase();

//   for (const [specialist, data] of Object.entries(specialists)) {
//     for (const keyword of data.keywords) {
//       if (symptomText.includes(keyword.toLowerCase())) {
//         neededSpecialists.add(specialist);
//         break; // No need to check other keywords for this specialist
//       }
//     }
//   }

//   return Array.from(neededSpecialists);
// }

// /**
//  * Simulates API call to a specialist agent
//  * @param {string} specialist - Specialist key
//  * @param {string[]} symptoms - Array of symptoms
//  * @returns {Promise<Object>} Specialist's response
//  */
// export async function callSpecialist(specialist, symptoms) {
//   // In a real implementation, this would be an actual API call
//   // For now, we'll simulate a response after a short delay
//   return new Promise(resolve => {
//     setTimeout(() => {
//       resolve({
//         specialist: specialists[specialist].description,
//         symptoms: symptoms,
//         assessment: `This is a simulated assessment from ${specialists[specialist].description}`,
//         recommendations: [
//           `Recommendation 1 from ${specialists[specialist].description}`,
//           `Recommendation 2 from ${specialists[specialist].description}`
//         ],
//         timestamp: new Date().toISOString()
//       });
//     }, Math.random() * 500 + 100); // Random delay between 100-600ms
//   });
// }

// /**
//  * Coordinates medium complexity cases to appropriate specialists
//  * @param {Object} caseData - The case data
//  * @param {string[]} caseData.symptoms - Array of symptoms
//  * @param {string} caseData.patientId - Patient ID
//  * @returns {Promise<Object>} Consolidated response from all needed specialists
//  */
// export async function coordinateMediumComplexityCase(caseData) {
//   try {
//     const { symptoms, patientId } = caseData;
    
//     if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
//       throw new Error('Invalid symptoms data');
//     }

//     // Determine which specialists are needed
//     const neededSpecialists = determineSpecialists(symptoms);

//     if (neededSpecialists.length === 0) {
//       return {
//         status: 'success',
//         message: 'No specialists identified for these symptoms',
//         patientId,
//         symptoms,
//         recommendations: []
//       };
//     }

//     // Call all needed specialists concurrently
//     const specialistPromises = neededSpecialists.map(specialist => 
//       callSpecialist(specialist, symptoms)
//     );

//     const specialistResponses = await Promise.all(specialistPromises);

//     // Consolidate responses
//     const consolidatedResponse = {
//       status: 'success',
//       patientId,
//       symptoms,
//       specialistAssessments: specialistResponses,
//       timestamp: new Date().toISOString()
//     };

//     return consolidatedResponse;
//   } catch (error) {
//     console.error('Error in coordinateMediumComplexityCase:', error);
//     return {
//       status: 'error',
//       message: error.message,
//       patientId: caseData.patientId || 'unknown',
//       timestamp: new Date().toISOString()
//     };
//   }
// }

// // For testing and direct usage
// export default {
//   determineSpecialists,
//   callSpecialist,
//   coordinateMediumComplexityCase
// };

// coordinator.js

import { geminiCoordinator } from './geminiCoordinator.js';

export const coordinator = async (symptomsArray) => {
  try {
    const relevantDoctors = await geminiCoordinator.getRelevantDoctors(symptomsArray);

    if (relevantDoctors.length === 0) {
      return { message: 'No suitable specialist found. Please consult a general physician.', doctors: [] };
    }

    return { message: 'Recommended specialists found.', doctors: relevantDoctors };

  } catch (error) {
    console.error('Error during doctor coordination:', error);
    return { message: 'An error occurred while finding doctors.', doctors: [] };
  }
};
