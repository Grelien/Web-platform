// scripts/migrate-to-mongodb.js - Migrate JSON data to MongoDB

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { connectDB, disconnectDB } = require('../config/database');
const { User, Schedule, IrrigationHistory } = require('../models');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SCHEDULES_FILE = path.join(DATA_DIR, 'schedules.json');
const HISTORY_FILE = path.join(DATA_DIR, 'irrigation-history.json');

async function loadJSONFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`⚠️  File not found: ${filePath}`);
            return [];
        }
        throw error;
    }
}

async function migrateUsers() {
    console.log('\n📁 Migrating Users...');
    const users = await loadJSONFile(USERS_FILE);

    if (users.length === 0) {
        console.log('   No users to migrate');
        return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const userData of users) {
        try {
            // Check if user already exists
            const existing = await User.findByPhoneNumber(userData.phoneNumber);
            if (existing) {
                console.log(`   ⏭️  Skipped: ${userData.phoneNumber} (already exists)`);
                skipped++;
                continue;
            }

            // Create new user
            const user = new User({
                phoneNumber: userData.phoneNumber,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: userData.password, // Already hashed
                role: userData.role || 'user',
                isActive: userData.isActive !== undefined ? userData.isActive : true,
                lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : null,
                createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
                updatedAt: new Date()
            });

            // Save without hashing password again (it's already hashed)
            await user.save({ validateBeforeSave: true });
            console.log(`   ✅ Migrated user: ${userData.phoneNumber}`);
            migrated++;
        } catch (error) {
            console.error(`   ❌ Error migrating user ${userData.phoneNumber}:`, error.message);
        }
    }

    console.log(`   📊 Users: ${migrated} migrated, ${skipped} skipped`);
}

async function migrateSchedules() {
    console.log('\n📁 Migrating Schedules...');
    const schedules = await loadJSONFile(SCHEDULES_FILE);

    if (schedules.length === 0) {
        console.log('   No schedules to migrate');
        return;
    }

    let migrated = 0;

    for (const scheduleData of schedules) {
        try {
            const schedule = new Schedule({
                time: scheduleData.time,
                action: scheduleData.action,
                duration: scheduleData.duration || 0,
                frequency: scheduleData.frequency || 'daily',
                date: scheduleData.date || null,
                active: scheduleData.active !== undefined ? scheduleData.active : true,
                lastExecuted: scheduleData.lastExecuted ? new Date(scheduleData.lastExecuted) : null,
                createdAt: scheduleData.createdAt ? new Date(scheduleData.createdAt) : new Date(),
                updatedAt: new Date()
            });

            await schedule.save();
            console.log(`   ✅ Migrated schedule: ${scheduleData.time} (${scheduleData.frequency})`);
            migrated++;
        } catch (error) {
            console.error(`   ❌ Error migrating schedule:`, error.message);
        }
    }

    console.log(`   📊 Schedules: ${migrated} migrated`);
}

async function migrateIrrigationHistory() {
    console.log('\n📁 Migrating Irrigation History...');
    const history = await loadJSONFile(HISTORY_FILE);

    if (history.length === 0) {
        console.log('   No history to migrate');
        return;
    }

    let migrated = 0;

    for (const historyData of history) {
        try {
            const irrigationEvent = new IrrigationHistory({
                action: historyData.action || 'COMPLETED',
                source: historyData.source || 'manual',
                duration: historyData.duration || 0,
                scheduleDetails: historyData.scheduleDetails || null,
                sensorData: historyData.sensorData || null,
                startTime: historyData.timestamp ? new Date(historyData.timestamp) : new Date(),
                endTime: historyData.endTime ? new Date(historyData.endTime) : null,
                createdAt: historyData.timestamp ? new Date(historyData.timestamp) : new Date(),
                updatedAt: new Date()
            });

            await irrigationEvent.save();
            migrated++;
        } catch (error) {
            console.error(`   ❌ Error migrating history:`, error.message);
        }
    }

    console.log(`   📊 History: ${migrated} migrated`);
}

async function migrate() {
    console.log('🚀 Starting MongoDB Migration...\n');
    console.log('⚠️  WARNING: This will migrate data from JSON files to MongoDB');
    console.log('   Make sure you have MongoDB running and configured properly\n');

    try {
        // Connect to MongoDB
        await connectDB();

        // Run migrations
        await migrateUsers();
        await migrateSchedules();
        await migrateIrrigationHistory();

        console.log('\n✅ Migration completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Verify data in MongoDB');
        console.log('   2. Update server.js to use MongoDB models');
        console.log('   3. Backup and remove old JSON files (optional)');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await disconnectDB();
    }
}

// Run migration
migrate();
