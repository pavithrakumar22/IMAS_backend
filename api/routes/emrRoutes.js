import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkUserId: req.params.userId }).select('emr');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user.emr || {});
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.put('/:userId', async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { clerkUserId: req.params.userId },
      { emr: req.body.emr },
      { new: true }
    ).select('emr');

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    res.status(200).json(updatedUser.emr);
  } catch {
    res.status(500).json({ error: 'Failed to update EMR' });
  }
});

export default router;
