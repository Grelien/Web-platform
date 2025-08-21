// routes/auth.js - Authentication routes

const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const {
    authLimiter,
    generateToken,
    verifyToken,
    handleValidationErrors
} = require('../middleware/auth');

const router = express.Router();

// Helper function to generate a unique phone number
function generatePhoneNumber() {
    // Generate a random 10-digit phone number starting with area codes 555-599 (reserved for fiction)
    const areaCode = Math.floor(Math.random() * 45) + 555; // 555-599
    const exchange = Math.floor(Math.random() * 900) + 100; // 100-999
    const number = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    return `${areaCode}${exchange}${number}`;
}

// Validation rules
const registerValidation = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
];

const loginValidation = [
    body('phoneNumber')
        .isLength({ min: 10, max: 10 })
        .isNumeric()
        .withMessage('Please provide a valid 10-digit phone number')
];

// Register route
router.post('/register', authLimiter, registerValidation, handleValidationErrors, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;

        // Generate a unique phone number
        let phoneNumber;
        let attempts = 0;
        do {
            phoneNumber = generatePhoneNumber();
            attempts++;
            if (attempts > 10) {
                throw new Error('Could not generate unique phone number');
            }
        } while (await User.findByPhoneNumber(phoneNumber));

        // Create user
        const userData = {
            phoneNumber,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: `user${phoneNumber}@agriiot.com`, // Generate email for compatibility
            password: 'temp123', // Temporary password since we don't use it
            isActive: true
        };

        const newUser = await User.create(userData);

        // Generate token
        const token = generateToken(newUser.id, newUser.phoneNumber);

        // Update last login
        await User.updateLastLogin(newUser.id);

        res.status(201).json({
            message: 'Account created successfully',
            user: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                phoneNumber: newUser.phoneNumber,
                isActive: newUser.isActive,
                createdAt: newUser.createdAt,
                lastLogin: newUser.lastLogin
            },
            token,
            phoneNumber: phoneNumber // Return the generated phone number
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        res.status(500).json({
            error: 'Registration failed. Please try again.'
        });
    }
});

// Login route
router.post('/login', /* authLimiter, */ loginValidation, handleValidationErrors, async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        console.log('Login attempt with phone number:', phoneNumber);

        // Find user by phone number
        const user = await User.findByPhoneNumber(phoneNumber);
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (!user) {
            console.log('All users in database:');
            const allUsers = await User.getAllUsers();
            allUsers.forEach(u => console.log(`- ID: ${u.id}, Phone: ${u.phoneNumber}`));
            
            return res.status(401).json({
                error: 'Phone number not found. Please check your number or create an account.'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                error: 'Account is deactivated. Please contact support.'
            });
        }

        // Generate token
        const token = generateToken(user.id, user.phoneNumber);

        // Update last login
        await User.updateLastLogin(user.id);

        // Remove sensitive data from response
        const { password: _, email: __, ...userWithoutSensitiveData } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutSensitiveData,
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

        const { password: _, email: __, ...userWithoutSensitiveData } = user;
        res.json({
            user: userWithoutSensitiveData
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
        .withMessage('Last name must be between 2 and 50 characters')
], handleValidationErrors, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const userId = req.user.userId;

        const updateData = {};
        if (firstName) updateData.firstName = firstName.trim();
        if (lastName) updateData.lastName = lastName.trim();

        const updatedUser = await User.updateById(userId, updateData);
        if (!updatedUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const { password: _, email: __, ...userWithoutSensitiveData } = updatedUser;
        res.json({
            message: 'Profile updated successfully',
            user: userWithoutSensitiveData
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            error: 'Failed to update profile'
        });
    }
});

// Logout route
router.post('/logout', verifyToken, (req, res) => {
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
            phoneNumber: req.user.phoneNumber
        }
    });
});

module.exports = router;
