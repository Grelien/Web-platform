// models/SensorData.model.js - Time-series sensor data collection

const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    farmId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: [true, 'Farm ID is required'],
        index: true
    },
    temperature: {
        type: Number,
        required: [true, 'Temperature is required']
    },
    humidity: {
        type: Number,
        required: [true, 'Humidity is required']
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false, // We use custom timestamp field
    timeseries: {
        timeField: 'timestamp',
        metaField: 'farmId',
        granularity: 'seconds'
    }
});

// Compound indexes for efficient queries
sensorDataSchema.index({ farmId: 1, timestamp: -1 }); // Get farm's recent data
sensorDataSchema.index({ userId: 1, timestamp: -1 }); // Get user's all data
sensorDataSchema.index({ timestamp: -1 }); // Recent data across all farms

// Static method to get recent readings for a farm
sensorDataSchema.statics.getRecentByFarm = function(farmId, limit = 100, page = 1) {
    const skip = (page - 1) * limit;
    return this.find({ farmId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
};

// Static method to get readings in a date range
sensorDataSchema.statics.getByDateRange = function(farmId, startDate, endDate, limit = 1000) {
    return this.find({
        farmId,
        timestamp: { $gte: startDate, $lte: endDate }
    })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
};

// Static method to get average readings for a time period
sensorDataSchema.statics.getAverageByPeriod = async function(farmId, startDate, endDate) {
    const result = await this.aggregate([
        {
            $match: {
                farmId: new mongoose.Types.ObjectId(farmId),
                timestamp: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                avgTemperature: { $avg: '$temperature' },
                avgHumidity: { $avg: '$humidity' },
                minTemperature: { $min: '$temperature' },
                maxTemperature: { $max: '$temperature' },
                minHumidity: { $min: '$humidity' },
                maxHumidity: { $max: '$humidity' },
                count: { $sum: 1 }
            }
        }
    ]);

    return result[0] || null;
};

// Static method to get hourly averages (for charts)
sensorDataSchema.statics.getHourlyAverages = function(farmId, hours = 24) {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.aggregate([
        {
            $match: {
                farmId: new mongoose.Types.ObjectId(farmId),
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m-%d %H:00',
                        date: '$timestamp'
                    }
                },
                avgTemperature: { $avg: '$temperature' },
                avgHumidity: { $avg: '$humidity' },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
};

// Static method to export data (for Excel)
sensorDataSchema.statics.exportData = function(farmId, startDate, endDate) {
    return this.find({
        farmId,
        timestamp: { $gte: startDate, $lte: endDate }
    })
        .sort({ timestamp: 1 }) // Ascending for Excel
        .select('timestamp temperature humidity -_id')
        .lean();
};

// Static method to clean old data (retention policy)
sensorDataSchema.statics.cleanOldData = async function(daysToKeep = 90) {
    try {
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
        const result = await this.deleteMany({ timestamp: { $lt: cutoffDate } });

        console.log(`🗑️  Cleaned ${result.deletedCount} sensor readings older than ${daysToKeep} days`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning old sensor data:', error);
        return 0;
    }
};

// Static method to get total count for a farm
sensorDataSchema.statics.getTotalCount = function(farmId) {
    return this.countDocuments({ farmId });
};

const SensorData = mongoose.model('SensorData', sensorDataSchema);

module.exports = SensorData;
