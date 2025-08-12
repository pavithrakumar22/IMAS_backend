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
