import mongoose from 'mongoose';

const emrSchema = new mongoose.Schema({
  medicalHistory: [String],
  allergies: [String],
  medications: [String],
  chronicConditions: [String],
  bloodType: String
}, { _id: false });

const userSchema = new mongoose.Schema({
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
  firstName: String,
  lastName: String,
  lastSignInAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  emr: emrSchema
});

export default mongoose.model('User', userSchema);