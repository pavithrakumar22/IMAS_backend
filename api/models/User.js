import mongoose from 'mongoose';

const diseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    default: null
  },
  nameTranslated: {
    type: String,
    default: null
  },
  diagnosis: {
    type: String,
    default: null
  },
  simplifiedDiagnosis: {  
    type: String,
    default: null
  },
  treatmentDate: {
    type: Date,
    default: null
  },
  outcome: {
    type: String,
    enum: ['cured', 'improved', 'referred', 'ongoing'],
    default: 'ongoing'
  },
  complexity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: null
  }
});

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true,
    default: null
  },
  name: {
    type: String,
    default: null
  },
  age: {
    type: Number,
    default: null
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
    default: null
  },
  
  Lastdisease: {
    type: String,
    default: null
  },
  LastdiseaseTranslated: {
    type: String,
    default: null
  },
  Lastdiagnosis: {
    type: String,
    default: null
  },
  LastdiagnosisSimplified: {
    type: String,
    default: null
  },
  LasttreatmentDate: {
    type: Date,
    default: null
  },
  Lastoutcome: {
    type: String,
    enum: ['cured', 'improved', 'referred', 'ongoing'],
    default: 'ongoing'
  },
  Lastcomplexity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: null
  },
  diseases: {
    type: [diseaseSchema],
    default: []
  }
});

const userSchema = new mongoose.Schema({
  // Existing auth fields
  clerkUserId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    default: null
  },
  lastName: {
    type: String,
    default: null
  },
  lastSignInAt: {
    type: Date,
    default: null
  },

  displayName: {
    type: String,
    default: null
  },

  role: {
    type: String,
    enum: ['RMP', 'CHW', 'Admin'],
    default: null
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  areaOfOperation: {
    type: String,
    default: null
  },

  totalPatients: {
    type: Number,
    default: 0
  },
  successfulCases: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  },

  patients: {
    type: [patientSchema],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema);