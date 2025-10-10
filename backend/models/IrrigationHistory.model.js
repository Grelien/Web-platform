// models/IrrigationHistory.model.js - MongoDB Irrigation History Model

const mongoose = require('mongoose');

const irrigationHistorySchema = new mongoose.Schema({
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
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: ['COMPLETED', 'ON', 'OFF'],
        default: 'COMPLETED'
    },
    source: {
        type: String,
        required: [true, 'Source is required'],
        enum: ['manual', 'schedule', 'device_confirm'],
        default: 'manual'
    },
    duration: {
        type: Number, // Duration in minutes
        required: false,
        min: 0
    },
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Schedule',
        required: false
    },
    scheduleDetails: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly'],
            required: false
        },
        date: {
            type: String,
            required: false
        },
        time: {
            type: String,
            required: false
        }
    },
    sensorData: {
        temperature: {
            type: Number,
            required: false
        },
        humidity: {
            type: Number,
            required: false
        }
    },
    startTime: {
        type: Date,
        required: false
    },
    endTime: {
        type: Date,
        required: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Indexes for faster queries
irrigationHistorySchema.index({ userId: 1, farmId: 1, createdAt: -1 });
irrigationHistorySchema.index({ farmId: 1, createdAt: -1 });
irrigationHistorySchema.index({ createdAt: -1 }); // Most recent first
irrigationHistorySchema.index({ source: 1, createdAt: -1 });
irrigationHistorySchema.index({ scheduleId: 1 });

// Virtual for calculating duration from start/end time if not provided
irrigationHistorySchema.virtual('calculatedDuration').get(function() {
    if (this.duration) return this.duration;
    if (this.startTime && this.endTime) {
        return Math.round((this.endTime - this.startTime) / (1000 * 60)); // minutes
    }
    return 0;
});

// Ensure virtuals are included in JSON
irrigationHistorySchema.set('toJSON', { virtuals: true });
irrigationHistorySchema.set('toObject', { virtuals: true });

// Static method to get history by farm
irrigationHistorySchema.statics.getByFarmId = function(farmId, limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    return this.find({ farmId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('scheduleId', 'time frequency action duration')
        .lean();
};

// Static method to get history by user
irrigationHistorySchema.statics.getByUserId = function(userId, limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('scheduleId', 'time frequency action duration')
        .lean();
};

// Static method to get recent history with pagination (all farms for a user)
irrigationHistorySchema.statics.getRecent = function(userId, limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('scheduleId', 'time frequency action duration')
        .populate('farmId', 'farmName deviceName')
        .lean();
};

// Static method to get history by source
irrigationHistorySchema.statics.getBySource = function(farmId, source, limit = 50) {
    return this.find({ farmId, source })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

// Static method to get total count for a farm
irrigationHistorySchema.statics.getTotalCount = function(farmId) {
    return this.countDocuments({ farmId });
};

// Static method to clean old records (keep only last N records)
irrigationHistorySchema.statics.cleanOldRecords = async function(keepCount = 500) {
    try {
        const total = await this.countDocuments();
        if (total <= keepCount) return 0;

        const toDelete = total - keepCount;
        const oldRecords = await this.find()
            .sort({ createdAt: 1 })
            .limit(toDelete)
            .select('_id');

        const ids = oldRecords.map(r => r._id);
        const result = await this.deleteMany({ _id: { $in: ids } });

        console.log(`🗑️  Cleaned ${result.deletedCount} old irrigation records`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning old records:', error);
        return 0;
    }
};

const IrrigationHistory = mongoose.model('IrrigationHistory', irrigationHistorySchema);

module.exports = IrrigationHistory;
