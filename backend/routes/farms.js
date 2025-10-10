// routes/farms.js - Farm management routes

const express = require('express');
const { body } = require('express-validator');
const Farm = require('../models/Farm.model');
const { verifyToken, handleValidationErrors } = require('../middleware/auth');

const router = express.Router();

const MAX_FARMS_PER_USER = 10;

// Validation rules
const farmValidation = [
    body('farmName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Farm name must be between 2 and 100 characters'),
    body('deviceName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Device name must be between 2 and 100 characters')
];

// Get all farms for logged-in user
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const farms = await Farm.findByUserId(userId);

        res.json({
            success: true,
            data: farms
        });
    } catch (error) {
        console.error('Error fetching farms:', error);
        res.status(500).json({
            error: 'Failed to fetch farms'
        });
    }
});

// Create new farm
router.post('/', verifyToken, farmValidation, handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { farmName, deviceName } = req.body;

        // Check farm limit
        const farmCount = await Farm.countByUserId(userId);
        if (farmCount >= MAX_FARMS_PER_USER) {
            return res.status(400).json({
                error: `Maximum of ${MAX_FARMS_PER_USER} farms allowed per user`
            });
        }

        // Create farm
        const farm = await Farm.create({
            userId,
            farmName: farmName.trim(),
            deviceName: deviceName.trim()
        });

        res.status(201).json({
            success: true,
            data: farm,
            message: 'Farm added successfully'
        });
    } catch (error) {
        console.error('Error creating farm:', error);
        res.status(500).json({
            error: 'Failed to create farm'
        });
    }
});

// Update farm
router.put('/:id', verifyToken, farmValidation, handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.userId;
        const farmId = req.params.id;
        const { farmName, deviceName } = req.body;

        // Find farm and verify ownership
        const farm = await Farm.findOne({ _id: farmId, userId });
        if (!farm) {
            return res.status(404).json({
                error: 'Farm not found or unauthorized'
            });
        }

        // Update farm
        farm.farmName = farmName.trim();
        farm.deviceName = deviceName.trim();
        await farm.save();

        res.json({
            success: true,
            data: farm,
            message: 'Farm updated successfully'
        });
    } catch (error) {
        console.error('Error updating farm:', error);
        res.status(500).json({
            error: 'Failed to update farm'
        });
    }
});

// Delete farm (hard delete)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const farmId = req.params.id;

        // Find and delete farm, verify ownership
        const farm = await Farm.findOneAndDelete({ _id: farmId, userId });
        if (!farm) {
            return res.status(404).json({
                error: 'Farm not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'Farm removed successfully'
        });
    } catch (error) {
        console.error('Error deleting farm:', error);
        res.status(500).json({
            error: 'Failed to delete farm'
        });
    }
});

module.exports = router;
