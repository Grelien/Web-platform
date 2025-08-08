// routes/auth.js - Authentication routes

const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const {
    authLimiter,
    validatePassword,
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    handleValidationErrors
} = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Register route
router.post('/register', authLimiter, registerValidation, handleValidationErrors, async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Additional password validation
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: passwordValidation.message
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const userData = {
            email: email.toLowerCase(),
            password: hashedPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim()
        };

        const newUser = await User.create(userData);

        // Generate token
        const token = generateToken(newUser.id, newUser.email);

        // Update last login
        await User.updateLastLogin(newUser.id);

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser.toJSON(),
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.message === 'User with this email already exists') {
            return res.status(409).json({
                error: 'An account with this email already exists'
            });
        }

        res.status(500).json({
            error: 'Registration failed. Please try again.'
        });
    }
});

// Login route
router.post('/login', authLimiter, loginValidation, handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                error: 'Account is deactivated. Please contact support.'
            });
        }

        // Compare password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user.id, user.email);

        // Update last login
        await User.updateLastLogin(user.id);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed. Please try again.'
        });
    }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch profile'
        });
    }
});

// Update user profile
router.put('/profile', verifyToken, [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
], handleValidationErrors, async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        const userId = req.user.userId;

        // Check if email is already taken by another user
        if (email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({
                    error: 'Email is already taken by another account'
                });
            }
        }

        const updateData = {};
        if (firstName) updateData.firstName = firstName.trim();
        if (lastName) updateData.lastName = lastName.trim();
        if (email) updateData.email = email.toLowerCase();

        const updatedUser = await User.updateById(userId, updateData);
        if (!updatedUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json({
            message: 'Profile updated successfully',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Failed to update profile'
        });
    }
});

// Change password
router.put('/change-password', verifyToken, [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
], handleValidationErrors, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                error: 'Current password is incorrect'
            });
        }

        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                error: passwordValidation.message
            });
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        // Update password
        await User.updateById(userId, { password: hashedNewPassword });

        res.json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            error: 'Failed to change password'
        });
    }
});

// Logout route (client-side token removal, but we can track it)
router.post('/logout', verifyToken, (req, res) => {
    // In a real application, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({
        message: 'Logged out successfully'
    });
});

// Verify token route
router.get('/verify', verifyToken, (req, res) => {
    res.json({
        valid: true,
        user: {
            userId: req.user.userId,
            email: req.user.email
        }
    });
});

module.exports = router;
