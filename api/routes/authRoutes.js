import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.post('/clerk-webhook', async (req, res) => {
  const { type, data } = req.body;

  try {
    console.log("Webhook payload:", req.body);

    if (type === 'user.created') {
      const user = await User.create({
        clerkUserId: data.id,
        email: data.email_addresses[0]?.email_address,
        firstName: data.first_name,
        lastName: data.last_name,
        lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : null,
      });
      console.log("User saved:", user);
    }

    if (type === 'user.updated') {
      const updatedUser = await User.findOneAndUpdate(
        { clerkUserId: data.id },
        {
          email: data.email_addresses[0]?.email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : null,
        },
        { new: true }
      );
      console.log("User updated:", updatedUser);
    }

    if (type === 'user.deleted') {
      const deletedUser = await User.findOneAndDelete({ clerkUserId: data.id });
      console.log("User deleted:", deletedUser);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

router.get("/sample", (req, res) => {
  res.status(200).json({ message: 'Backend auth server is running' });
});

router.post('/sync-user', async (req, res) => {
  try {
    res.status(200).json({ message: 'Sync user not needed when using webhooks' });
  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkUserId: req.params.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error); // ✅ Now using the error
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/update-user', async (req, res) => {
  try {
    const { clerkUserId, updates } = req.body;

    console.log("Received update request for user:", clerkUserId);
    console.log("Update data:", updates);

    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkUserId: clerkUserId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.log("User not found with clerkUserId:", clerkUserId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log("User updated successfully:", updatedUser);

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const clerkUserId = req.headers['x-clerk-user-id'] || req.query.clerkUserId;

    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    const user = await User.findOne({ clerkUserId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log("🔹 Express /me - Patients found:", user.patients?.length || 0);

    res.status(200).json({
      user: {
        clerkUserId: user.clerkUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        role: user.role,
        experienceYears: user.experienceYears,
        areaOfOperation: user.areaOfOperation,
        totalPatients: user.totalPatients,
        successfulCases: user.successfulCases,
        successRate: user.successRate,
        patients: user.patients, // This now includes diseases array and Last* fields
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/get-all-patients', async (req, res) => {
  try {
    const { clerkUserId } = req.query;

    if (!clerkUserId) {
      return res.status(400).json({
        success: false,
        message: 'clerkUserId is required'
      });
    }

    const user = await User.findOne({ clerkUserId }).select('patients');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      patients: user.patients || [],
      totalPatients: user.patients?.length || 0
    });

  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.get('/get-patient', async (req, res) => {
  try {
    const { clerkUserId, patientId } = req.query;

    if (!clerkUserId) {
      return res.status(400).json({
        success: false,
        message: 'clerkUserId is required'
      });
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required'
      });
    }

    const user = await User.findOne({ clerkUserId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const patient = user.patients.find(p => p.patientId === patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      patient: patient
    });

  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/append-patient', async (req, res) => {
  try {
    const { clerkUserId, patientData } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({
        success: false,
        message: 'clerkUserId is required'
      });
    }

    if (!patientData || !patientData.name || !patientData.age) {
      return res.status(400).json({
        success: false,
        message: 'Patient name and age are required'
      });
    }

    const user = await User.findOne({ clerkUserId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let patient;
    let isNewPatient = true;

    if (patientData.patientId) {
      // Find existing patient
      patient = user.patients.find(p => p.patientId === patientData.patientId);
      if (patient) {
        isNewPatient = false;
      }
    }

    if (isNewPatient) {
      // Create new patient
      const patientId = `PAT${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      patient = {
        patientId,
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender || null,
        Lastdisease: patientData.disease || null,
        LastdiseaseTranslated: patientData.diseaseTranslated || null,
        Lastdiagnosis: patientData.diagnosis || null,
        LastdiagnosisSimplified: patientData.simplifiedDiagnosis || null, // NEW FIELD
        LasttreatmentDate: patientData.treatmentDate || new Date(),
        Lastoutcome: patientData.outcome || 'ongoing',
        Lastcomplexity: patientData.complexity || null,
        diseases: patientData.diseases || []
      };

      // Only add to diseases array if we have valid disease data
      if (patientData.disease && patientData.diagnosis) {
        patient.diseases.push({
          name: patientData.disease,
          nameTranslated: patientData.diseaseTranslated || null,
          diagnosis: patientData.diagnosis, // Original professional diagnosis
          simplifiedDiagnosis: patientData.simplifiedDiagnosis || null, // Simplified patient-friendly version
          treatmentDate: patientData.treatmentDate || new Date(),
          outcome: patientData.outcome || 'ongoing',
          complexity: patientData.complexity || null
        });
      }

      user.patients.push(patient);
      user.totalPatients += 1;
    } else {
      if (patientData.diagnosis) {
        const newDisease = {
          name: patientData.disease || null,
          nameTranslated: patientData.diseaseTranslated || null,
          diagnosis: patientData.diagnosis,
          simplifiedDiagnosis: patientData.simplifiedDiagnosis || null,
          treatmentDate: patientData.treatmentDate || new Date(),
          outcome: patientData.outcome || 'ongoing',
          complexity: patientData.complexity || null
        };

        patient.diseases.push(newDisease);

        patient.Lastdisease = patientData.disease || patient.Lastdisease;
        patient.LastdiseaseTranslated = patientData.diseaseTranslated || patient.LastdiseaseTranslated;
        patient.Lastdiagnosis = patientData.diagnosis;
        patient.LastdiagnosisSimplified = patientData.simplifiedDiagnosis || patient.LastdiagnosisSimplified; 
        patient.LasttreatmentDate = patientData.treatmentDate || new Date();
        patient.Lastoutcome = patientData.outcome || 'ongoing';
        patient.Lastcomplexity = patientData.complexity || patient.Lastcomplexity;
      }
    }

    const hasSuccessfulOutcome = patient.diseases.some(disease =>
      disease.outcome === 'cured' || disease.outcome === 'improved'
    );

    if (hasSuccessfulOutcome) {
      if (isNewPatient || patientData.outcome === 'cured' || patientData.outcome === 'improved') {
        user.successfulCases += 1;
      }
    }

    user.successRate = user.totalPatients > 0 ?
      (user.successfulCases / user.totalPatients) * 100 : 0;

    await user.save();

    res.status(201).json({
      success: true,
      message: isNewPatient ? 'Patient added successfully' : 'Patient updated successfully',
      patient: patient,
      userStats: {
        totalPatients: user.totalPatients,
        successfulCases: user.successfulCases,
        successRate: user.successRate
      }
    });

  } catch (error) {
    console.error('Error saving patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/add-disease', async (req, res) => {
  try {
    const { clerkUserId, patientId, diseaseData } = req.body;

    if (!clerkUserId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'clerkUserId and patientId are required'
      });
    }

    if (!diseaseData || !diseaseData.name) {
      return res.status(400).json({
        success: false,
        message: 'Disease name is required'
      });
    }

    const user = await User.findOne({ clerkUserId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const patient = user.patients.id(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const newDisease = {
      name: diseaseData.name,
      nameTranslated: diseaseData.nameTranslated || null,
      diagnosis: diseaseData.diagnosis || null,
      treatmentDate: diseaseData.treatmentDate || new Date(),
      outcome: diseaseData.outcome || 'ongoing',
      complexity: diseaseData.complexity || null
    };

    patient.diseases.push(newDisease);

    patient.Lastdisease = diseaseData.name;
    patient.LastdiseaseTranslated = diseaseData.nameTranslated || null;
    patient.Lastdiagnosis = diseaseData.diagnosis || null;
    patient.LasttreatmentDate = diseaseData.treatmentDate || new Date();
    patient.Lastoutcome = diseaseData.outcome || 'ongoing';
    patient.Lastcomplexity = diseaseData.complexity || null;

    if (newDisease.outcome === 'cured' || newDisease.outcome === 'improved') {
      user.successfulCases += 1;
    }

    user.successRate = user.totalPatients > 0 ?
      (user.successfulCases / user.totalPatients) * 100 : 0;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Disease added successfully',
      disease: newDisease,
      patient: patient
    });

  } catch (error) {
    console.error('Error adding disease:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.patch('/update-disease-outcome', async (req, res) => {
  try {
    const { clerkUserId, patientId, diseaseIndex, outcome } = req.body;

    if (!clerkUserId || !patientId || diseaseIndex === undefined || !outcome) {
      return res.status(400).json({
        success: false,
        message: 'clerkUserId, patientId, diseaseIndex, and outcome are required'
      });
    }

    const user = await User.findOne({ clerkUserId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const patient = user.patients.id(patientId);
    if (!patient || !patient.diseases[diseaseIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Patient or disease not found'
      });
    }

    const previousOutcome = patient.diseases[diseaseIndex].outcome;
    patient.diseases[diseaseIndex].outcome = outcome;

    if (diseaseIndex === 0) {
      patient.Lastoutcome = outcome;
    }

    const wasPreviouslySuccessful = previousOutcome === 'cured' || previousOutcome === 'improved';
    const isNowSuccessful = outcome === 'cured' || outcome === 'improved';

    if (wasPreviouslySuccessful && !isNowSuccessful) {
      user.successfulCases = Math.max(0, user.successfulCases - 1);
    } else if (!wasPreviouslySuccessful && isNowSuccessful) {
      user.successfulCases += 1;
    }

    user.successRate = user.totalPatients > 0 ?
      (user.successfulCases / user.totalPatients) * 100 : 0;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Disease outcome updated successfully',
      disease: patient.diseases[diseaseIndex],
      userStats: {
        successfulCases: user.successfulCases,
        successRate: user.successRate
      }
    });

  } catch (error) {
    console.error('Error updating disease outcome:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});

export default router;