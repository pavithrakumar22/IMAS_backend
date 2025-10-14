import mongoose from 'mongoose';

// Patient schema
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
  disease: {
    type: String,
    default: null
  },
  diagnosis: {
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

// Main User schema
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

  // Combined name for display
  displayName: {
    type: String,
    default: null
  },

  // Medical Professional Specific Fields
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

  // Practice Statistics
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

  // Patients treated by this healthcare worker
  patients: {
    type: [patientSchema],
    default: []
  },

  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema);
