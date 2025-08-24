import { Router } from 'express';
import { getUserById, getProfileByUserId } from '../../db/utils.js';

const router = Router();

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user data
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user profile
    const profile = await getProfileByUserId(id);

    // Return user data without sensitive information
    const { passwordHash, refreshTokens, ...userData } = user;

    res.json({
      user: userData,
      profile: profile || null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // TODO: Implement update user profile logic
    // This will require authentication middleware to ensure users can only update their own profiles

    res.json({ message: 'Profile update not implemented yet' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as userRoutes };
