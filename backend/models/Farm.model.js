// models/Farm.model.js - Farm/Device Model with User Association

const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    farmName: {
        type: String,
        required: [true, 'Farm name is required'],
        trim: true,
        minlength: [2, 'Farm name must be at least 2 characters'],
        maxlength: [100, 'Farm name must be less than 100 characters']
    },
    deviceName: {
        type: String,
        required: [true, 'Device name is required'],
        trim: true,
        minlength: [2, 'Device name must be at least 2 characters'],
        maxlength: [100, 'Device name must be less than 100 characters']
    },
    // Real-time sensor data
    sensorData: {
        temperature: {
            type: Number,
            default: 0
        },
        humidity: {
            type: Number,
            default: 0
        },
        lastUpdated: {
            type: Date,
            default: null
        }
    },
    // Motor status
    motorStatus: {
        isOn: {
            type: Boolean,
            default: false
        },
        lastChanged: {
            type: Date,
            default: null
        }
    },
    // Device connectivity
    deviceStatus: {
        isOnline: {
            type: Boolean,
            default: false
        },
        lastSeen: {
            type: Date,
            default: null
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries by userId
farmSchema.index({ userId: 1, createdAt: -1 });

// Static method to find farms by user
farmSchema.statics.findByUserId = function(userId) {
    return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to count farms by user
farmSchema.statics.countByUserId = function(userId) {
    return this.countDocuments({ userId, isActive: true });
};

// Don't return __v in JSON
farmSchema.methods.toJSON = function() {
    const farm = this.toObject();
    delete farm.__v;
    return farm;
};

const Farm = mongoose.model('Farm', farmSchema);

module.exports = Farm;
