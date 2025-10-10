// routes/sensorData.js - Sensor data history routes

const express = require('express');
const SensorData = require('../models/SensorData.model');
const Farm = require('../models/Farm.model');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get sensor data history for a farm
router.get('/farms/:farmId/sensor-data', verifyToken, async (req, res) => {
    try {
        const farmId = req.params.farmId;
        const userId = req.user.userId;
        const { limit = 100, page = 1, startDate, endDate } = req.query;

        // Verify farm ownership
        const farm = await Farm.findOne({ _id: farmId, userId });
        if (!farm) {
            return res.status(404).json({ error: 'Farm not found or unauthorized' });
        }

        let data;
        if (startDate && endDate) {
            // Get data for specific date range
            data = await SensorData.getByDateRange(
                farmId,
                new Date(startDate),
                new Date(endDate),
                parseInt(limit)
            );
        } else {
            // Get recent data
            data = await SensorData.getRecentByFarm(
                farmId,
                parseInt(limit),
                parseInt(page)
            );
        }

        const total = await SensorData.getTotalCount(farmId);

        res.json({
            success: true,
            data: {
                readings: data,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({ error: 'Failed to fetch sensor data' });
    }
});

// Get sensor data statistics for a farm
router.get('/farms/:farmId/sensor-stats', verifyToken, async (req, res) => {
    try {
        const farmId = req.params.farmId;
        const userId = req.user.userId;
        const { startDate, endDate, period = '24h' } = req.query;

        // Verify farm ownership
        const farm = await Farm.findOne({ _id: farmId, userId });
        if (!farm) {
            return res.status(404).json({ error: 'Farm not found or unauthorized' });
        }

        // Calculate date range
        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            // Use period
            end = new Date();
            const hours = period === '24h' ? 24 : period === '7d' ? 168 : period === '30d' ? 720 : 24;
            start = new Date(end.getTime() - hours * 60 * 60 * 1000);
        }

        const stats = await SensorData.getAverageByPeriod(farmId, start, end);

        res.json({
            success: true,
            data: {
                period: { start, end },
                ...stats
            }
        });
    } catch (error) {
        console.error('Error fetching sensor stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get hourly averages (for charts)
router.get('/farms/:farmId/sensor-chart', verifyToken, async (req, res) => {
    try {
        const farmId = req.params.farmId;
        const userId = req.user.userId;
        const { hours = 24 } = req.query;

        // Verify farm ownership
        const farm = await Farm.findOne({ _id: farmId, userId });
        if (!farm) {
            return res.status(404).json({ error: 'Farm not found or unauthorized' });
        }

        const chartData = await SensorData.getHourlyAverages(farmId, parseInt(hours));

        res.json({
            success: true,
            data: chartData
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// Export sensor data to CSV/JSON
router.get('/farms/:farmId/sensor-export', verifyToken, async (req, res) => {
    try {
        const farmId = req.params.farmId;
        const userId = req.user.userId;
        const { startDate, endDate, format = 'json' } = req.query;

        // Verify farm ownership
        const farm = await Farm.findOne({ _id: farmId, userId });
        if (!farm) {
            return res.status(404).json({ error: 'Farm not found or unauthorized' });
        }

        // Default to last 7 days if no dates provided
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

        const data = await SensorData.exportData(farmId, start, end);

        if (format === 'csv') {
            // Convert to CSV
            const csv = [
                'Timestamp,Temperature (°C),Humidity (%)',
                ...data.map(row => `${row.timestamp},${row.temperature},${row.humidity}`)
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=sensor-data-${farm.farmName}-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`);
            res.send(csv);
        } else {
            // Return JSON
            res.json({
                success: true,
                data: {
                    farmName: farm.farmName,
                    deviceName: farm.deviceName,
                    period: { start, end },
                    readings: data,
                    total: data.length
                }
            });
        }
    } catch (error) {
        console.error('Error exporting sensor data:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Clean old sensor data (admin or scheduled job)
router.delete('/sensor-data/cleanup', verifyToken, async (req, res) => {
    try {
        const { daysToKeep = 90 } = req.body;

        // Optional: Add admin check here
        // if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

        const deletedCount = await SensorData.cleanOldData(parseInt(daysToKeep));

        res.json({
            success: true,
            message: `Cleaned up sensor data older than ${daysToKeep} days`,
            deletedCount
        });
    } catch (error) {
        console.error('Error cleaning sensor data:', error);
        res.status(500).json({ error: 'Failed to clean data' });
    }
});

module.exports = router;
