import express from 'express';
import { Clerk } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';

const router = express.Router();
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

router.post('/sync-user', async (req, res) => {
  try {
    const { userId } = req.body;
    const clerkUser = await clerk.users.getUser(userId);
    const user = await User.findOneAndUpdate(
      { clerkUserId: userId },
      {
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        lastSignInAt: clerkUser.lastSignInAt
      },
      { upsert: true, new: true }
    );
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkUserId: req.params.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});

export default router;