// config/database.js - MongoDB connection configuration

const mongoose = require('mongoose');

let isMongoAvailable = false;

const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agri-iot-platform';

        // Set connection timeout to 5 seconds instead of default 30
        const conn = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            connectTimeoutMS: 5000,
            socketTimeoutMS: 5000,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        isMongoAvailable = true;

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            isMongoAvailable = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
            isMongoAvailable = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
            isMongoAvailable = true;
        });

        return conn;
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        isMongoAvailable = false;

        // In production, you might want to exit
        if (process.env.NODE_ENV === 'production') {
            console.error('🛑 Cannot run in production without database. Exiting...');
            process.exit(1);
        } else {
            console.warn('⚠️  MongoDB not available - using temporary in-memory storage');
            console.warn('⚠️  Please install and start MongoDB for full functionality');
        }
    }
};

// Graceful shutdown
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
    }
};

const getMongoStatus = () => isMongoAvailable;

module.exports = { connectDB, disconnectDB, getMongoStatus };
