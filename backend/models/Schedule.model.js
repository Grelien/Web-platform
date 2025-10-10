// models/Schedule.model.js - MongoDB Schedule Model

const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
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
    time: {
        type: String,
        required: [true, 'Time is required'],
        validate: {
            validator: function(v) {
                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: 'Time must be in HH:MM format (24-hour)'
        }
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: ['on', 'off'],
        lowercase: true
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [0, 'Duration must be at least 0 minutes'],
        max: [1440, 'Duration cannot exceed 24 hours (1440 minutes)'],
        default: 0
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly'],
        default: 'daily'
    },
    date: {
        type: String, // ISO date string for weekly schedules
        required: false,
        validate: {
            validator: function(v) {
                if (this.frequency === 'weekly' && !v) {
                    return false;
                }
                return true;
            },
            message: 'Date is required for weekly schedules'
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    lastExecuted: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
scheduleSchema.index({ userId: 1, farmId: 1 });
scheduleSchema.index({ farmId: 1, active: 1 });
scheduleSchema.index({ time: 1, active: 1 });

// Static method to find schedules by farm
scheduleSchema.statics.findByFarmId = function(farmId) {
    return this.find({ farmId, active: true }).sort({ time: 1 });
};

// Static method to find schedules by user
scheduleSchema.statics.findByUserId = function(userId) {
    return this.find({ userId, active: true }).sort({ time: 1 });
};

// Method to check if schedule should execute
scheduleSchema.methods.shouldExecute = function() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = now.toDateString();

    // Check if time matches
    if (this.time !== currentTime || !this.active) {
        return false;
    }

    // For daily schedules, check if already executed today
    if (this.frequency === 'daily') {
        if (this.lastExecuted && this.lastExecuted.toDateString() === today) {
            return false;
        }
        return true;
    }

    // For weekly schedules, check date
    if (this.frequency === 'weekly') {
        const scheduleDate = new Date(this.date);
        if (scheduleDate.toDateString() === today && !this.lastExecuted) {
            return true;
        }
    }

    return false;
};

// Method to mark as executed
scheduleSchema.methods.markExecuted = async function() {
    this.lastExecuted = new Date();

    // Deactivate weekly schedules after execution
    if (this.frequency === 'weekly') {
        this.active = false;
    }

    return await this.save();
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
