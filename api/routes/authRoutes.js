import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
// import { currentUser } from '@clerk/nextjs/server';

const router = express.Router();
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// ✅ Middleware to verify Clerk webhook signature (can enable in production)
function verifyClerkWebhook(req, res, next) {
  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).send('Missing Clerk webhook headers');
  }

  const payload = JSON.stringify(req.body);
  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;
  const hmac = crypto.createHmac('sha256', CLERK_WEBHOOK_SECRET);
  hmac.update(signedPayload);
  const digest = hmac.digest('base64');

  if (digest !== svixSignature) {
    return res.status(400).send('Invalid Clerk webhook signature');
  }

  next();
}

// 🔹 Clerk Webhook Endpoint
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

// 🔹 Sample endpoint to test backend
router.get("/sample", (req, res) => {
  res.status(200).json({ message: 'Backend auth server is running' });
});

// 🔹 Sync user (optional, not needed if using webhooks)
router.post('/sync-user', async (req, res) => {
  try {
    const { userId } = req.body;
    res.status(200).json({ message: 'Sync user not needed when using webhooks' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// 🔹 Get user by Clerk ID
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkUserId: req.params.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// 🔹 Update User Profile - FIXED FOR ALL USERS
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

// 🔹 Get current user by Clerk ID (for authenticated users)
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

    console.log("🔹 Express /me - Patients found:", user.patients?.length || 0); // Debug log

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
        patients: user.patients, // ← ADD THIS LINE
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// 🔹 Logout (dummy endpoint)
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});

export default router;