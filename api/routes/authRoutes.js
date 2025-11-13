import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.post('/clerk-webhook', async (req, res) => {
  const { type, data } = req.body;

  try {
    console.log("Webhook payload:", req.body);

    if (type === 'user.created') {
      const userData = {
        clerkUserId: data.id,
        email: data.email_addresses[0]?.email_address,
        firstName: data.first_name || null,
        lastName: data.last_name || null,
        lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : null,
        displayName: null,
        role: null,
        experienceYears: 0,
        areaOfOperation: null,
        interviewPassed: false,
        totalPatients: 0,
        successfulCases: 0,
        successRate: 0,
        patients: [] 
      };

      const user = await User.create(userData);
      console.log("User saved:", user);
    }

    if (type === 'user.updated') {
      const updateData = {
        email: data.email_addresses[0]?.email_address,
        firstName: data.first_name || null,
        lastName: data.last_name || null,
        lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : null,
      };

      const updatedUser = await User.findOneAndUpdate(
        { clerkUserId: data.id },
        updateData,
        { new: true }
      );

      if (!updatedUser) {
        const newUser = await User.create({
          clerkUserId: data.id,
          email: data.email_addresses[0]?.email_address,
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : null,
          displayName: null,
          role: null,
          experienceYears: 0,
          areaOfOperation: null,
          interviewPassed: false, 
          totalPatients: 0,
          successfulCases: 0,
          successRate: 0,
          patients: []
        });
        console.log("User created as fallback:", newUser);
      } else {
        console.log("User updated:", updatedUser);
      }
    }

    if (type === 'user.deleted') {
      const deletedUser = await User.findOneAndDelete({ clerkUserId: data.id });
      console.log("User deleted:", deletedUser);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    
    if (error.code === 11000) {
      console.log('Duplicate key error, attempting to find existing user...');
      
      try {
        const existingUser = await User.findOne({ clerkUserId: data.id });
        if (existingUser) {
          console.log('User already exists:', existingUser._id);
          return res.status(200).json({ 
            success: true, 
            message: 'User already exists in database' 
          });
        }
        
        const userData = {
          clerkUserId: data.id,
          email: data.email_addresses[0]?.email_address,
          firstName: data.first_name || null,
          lastName: data.last_name || null,
          lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : null,
          displayName: null,
          role: null,
          experienceYears: 0,
          areaOfOperation: null,
          interviewPassed: false, 
          totalPatients: 0,
          successfulCases: 0,
          successRate: 0,
          patients: []
        };

        const user = await User.create(userData);
        console.log("User saved via create:", user);
        return res.status(200).json({ success: true });
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        
        try {
          const existingUserByEmail = await User.findOne({ 
            email: data.email_addresses[0]?.email_address 
          });
          if (existingUserByEmail) {
            console.log('User exists with same email:', existingUserByEmail._id);
            return res.status(200).json({ 
              success: true, 
              message: 'User exists with same email' 
            });
          }
        } catch (emailError) {
          console.error('Email lookup error:', emailError);
        }
        
        return res.status(500).json({ error: 'Failed to process user after duplicate key error' });
      }
    }
    
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

router.get("/sample", (req, res) => {
  res.status(200).json({ message: 'Backend auth server is running' });
});

router.post('/sync-user', async (req, res) => {
  try {
    const { clerkUserId, email, firstName, lastName } = req.body;
    
    if (!clerkUserId && !email) {
      return res.status(200).json({ 
        message: 'Sync not needed - webhooks handle user synchronization',
        webhookBased: true
      });
    }
    
    if (!clerkUserId || !email) {
      return res.status(400).json({ 
        error: 'clerkUserId and email are required for manual sync' 
      });
    }

    const userData = {
      clerkUserId,
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      displayName: null,
      role: null,
      experienceYears: 0,
      areaOfOperation: null,
      interviewPassed: false,
      totalPatients: 0,
      successfulCases: 0,
      successRate: 0,
      patients: []
    };

    try {
      const user = await User.create(userData);
      res.status(200).json({ 
        message: 'User created successfully',
        user 
      });
    } catch (createError) {
      if (createError.code === 11000) {
        const existingUser = await User.findOne({ clerkUserId });
        res.status(200).json({ 
          message: 'User already exists',
          user: existingUser 
        });
      } else {
        throw createError;
      }
    }
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
    console.error('Get user error:', error);
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

    // Auto-set interviewPassed based on role
    if (updates.role) {
      if (updates.role === 'Guest') {
        updates.interviewPassed = true; // Guest users automatically pass interview
      } else if (['RMP', 'CHW', 'Admin'].includes(updates.role)) {
        updates.interviewPassed = false; // Professional roles start with interview not passed
      }
      console.log("Auto-set interviewPassed based on role:", updates.role, "->", updates.interviewPassed);
    }

    if (updates.patients) {
      updates.patients = updates.patients.map(patient => ({
        ...patient,
        patientId: patient.patientId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));
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
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate patient ID detected. Please ensure all patient IDs are unique.' 
      });
    }
    
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
        patients: user.patients, 
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
        LastdiagnosisSimplified: patientData.simplifiedDiagnosis || null,
        LasttreatmentDate: patientData.treatmentDate || new Date(),
        Lastoutcome: patientData.outcome || 'ongoing',
        Lastcomplexity: patientData.complexity || null,
        diseases: patientData.diseases || []
      };

      if (patientData.disease && patientData.diagnosis) {
        patient.diseases.push({
          name: patientData.disease,
          nameTranslated: patientData.diseaseTranslated || null,
          diagnosis: patientData.diagnosis,
          simplifiedDiagnosis: patientData.simplifiedDiagnosis || null,
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

    // Recalculate successful cases and success rate across ALL patients and ALL diseases
    let totalCases = 0;
    let successfulCases = 0;

    user.patients.forEach(patient => {
      patient.diseases.forEach(disease => {
        totalCases += 1;
        if (disease.outcome === 'cured' || disease.outcome === 'improved') {
          successfulCases += 1;
        }
      });
    });

    user.successfulCases = successfulCases;
    user.successRate = totalCases > 0 ? (successfulCases / totalCases) * 100 : 0;

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

    const patient = user.patients.find(p => p.patientId === patientId);
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
      simplifiedDiagnosis: diseaseData.simplifiedDiagnosis || null,
      treatmentDate: diseaseData.treatmentDate || new Date(),
      outcome: diseaseData.outcome || 'ongoing',
      complexity: diseaseData.complexity || null
    };

    patient.diseases.push(newDisease);

    patient.Lastdisease = diseaseData.name;
    patient.LastdiseaseTranslated = diseaseData.nameTranslated || null;
    patient.Lastdiagnosis = diseaseData.diagnosis || null;
    patient.LastdiagnosisSimplified = diseaseData.simplifiedDiagnosis || null;
    patient.LasttreatmentDate = diseaseData.treatmentDate || new Date();
    patient.Lastoutcome = diseaseData.outcome || 'ongoing';
    patient.Lastcomplexity = diseaseData.complexity || null;

    let totalCases = 0;
    let successfulCases = 0;

    user.patients.forEach(patient => {
      patient.diseases.forEach(disease => {
        totalCases += 1;
        if (disease.outcome === 'cured' || disease.outcome === 'improved') {
          successfulCases += 1;
        }
      });
    });

    user.successfulCases = successfulCases;
    user.successRate = totalCases > 0 ? (successfulCases / totalCases) * 100 : 0;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Disease added successfully',
      disease: newDisease,
      patient: patient,
      userStats: {
        totalPatients: user.totalPatients,
        successfulCases: user.successfulCases,
        successRate: user.successRate
      }
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

    // FIX: Use find() to search by patientId field
    const patient = user.patients.find(p => p.patientId === patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (!patient.diseases || !patient.diseases[diseaseIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found at the specified index'
      });
    }

    const previousOutcome = patient.diseases[diseaseIndex].outcome;
    
    patient.diseases[diseaseIndex].outcome = outcome;

    if (diseaseIndex === 0) {
      patient.Lastoutcome = outcome;
    }

    let totalCases = 0;
    let successfulCases = 0;

    user.patients.forEach(patient => {
      patient.diseases.forEach(disease => {
        totalCases += 1;
        if (disease.outcome === 'cured' || disease.outcome === 'improved') {
          successfulCases += 1;
        }
      });
    });

    user.successfulCases = successfulCases;
    user.successRate = totalCases > 0 ? (successfulCases / totalCases) * 100 : 0;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Disease outcome updated successfully',
      disease: patient.diseases[diseaseIndex],
      userStats: {
        totalPatients: user.totalPatients,
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