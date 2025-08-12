import mongoose from 'mongoose';

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
  }
});

export default mongoose.model('User', userSchema);