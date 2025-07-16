// server.js - Complete Node.js Backend for Agricultural IoT Platform

const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MQTT Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

// Data file paths
const SCHEDULES_FILE = path.join(__dirname, 'data', 'schedules.json');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// System State
let systemState = {
    mqttConnected: false,
    motorState: false,
    sensorData: {
        temperature: 24.5,
        humidity: 65,
        lastUpdated: new Date()
    },
    schedules: [],
    logs: [],
    activeScheduleTimers: new Map()
};

// MQTT Client Setup
const mqttClient = mqtt.connect(MQTT_BROKER, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clientId: 'agri-iot-server-' + Math.random().toString(16).substring(2, 8),
    reconnectPeriod: 5000,
    connectTimeout: 30000
});

// MQTT Event Handlers
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    systemState.mqttConnected = true;
    addLog('MQTT client connected to broker');
    
    // Subscribe to device topics
    const topics = [
        'agri/sensors/temperature',
        'agri/sensors/humidity',
        'agri/motor/status',
        'agri/device/status'
    ];
    
    topics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
            if (err) {
                console.error(`Failed to subscribe to ${topic}:`, err);
                addLog(`Failed to subscribe to ${topic}: ${err.message}`);
            } else {
                console.log(`Subscribed to ${topic}`);
                addLog(`Subscribed to MQTT topic: ${topic}`);
            }
        });
    });
});

mqttClient.on('message', (topic, message) => {
    const payload = message.toString();
    console.log(`Received message on ${topic}: ${payload}`);
    
    try {
        handleMQTTMessage(topic, payload);
    } catch (error) {
        console.error('Error handling MQTT message:', error);
        addLog(`Error processing MQTT message: ${error.message}`);
    }
});

mqttClient.on('error', (error) => {
    console.error('MQTT error:', error);
    systemState.mqttConnected = false;
    addLog(`MQTT connection error: ${error.message}`);
});

mqttClient.on('close', () => {
    console.log('MQTT connection closed');
    systemState.mqttConnected = false;
    addLog('MQTT connection closed');
});

mqttClient.on('reconnect', () => {
    console.log('Attempting to reconnect to MQTT broker...');
    addLog('Attempting to reconnect to MQTT broker...');
});

// Handle MQTT Messages
function handleMQTTMessage(topic, payload) {
    switch (topic) {
        case 'agri/sensors/temperature':
            systemState.sensorData.temperature = parseFloat(payload);
            systemState.sensorData.lastUpdated = new Date();
            addLog(`Temperature updated: ${payload}°C`);
            break;
            
        case 'agri/sensors/humidity':
            systemState.sensorData.humidity = parseFloat(payload);
            systemState.sensorData.lastUpdated = new Date();
            addLog(`Humidity updated: ${payload}%`);
            break;
            
        case 'agri/motor/status':
            systemState.motorState = payload === 'ON';
            addLog(`Motor status: ${payload}`);
            break;
            
        case 'agri/device/status':
            addLog(`Device status: ${payload}`);
            break;
    }
}

// Utility Functions
function addLog(message) {
    const timestamp = new Date().toISOString();
    systemState.logs.unshift({
        time: timestamp,
        message: message
    });
    
    // Keep only last 100 logs
    if (systemState.logs.length > 100) {
        systemState.logs = systemState.logs.slice(0, 100);
    }
    
    console.log(`[${timestamp}] ${message}`);
}

function publishMQTT(topic, message) {
    if (systemState.mqttConnected) {
        mqttClient.publish(topic, message, (err) => {
            if (err) {
                console.error(`Failed to publish to ${topic}:`, err);
                addLog(`Failed to publish to ${topic}: ${err.message}`);
            } else {
                addLog(`Published to ${topic}: ${message}`);
            }
        });
    } else {
        addLog('Cannot publish: MQTT not connected');
    }
}

// File Operations
function saveSchedules() {
    try {
        fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(systemState.schedules, null, 2));
        addLog('Schedules saved to file');
    } catch (error) {
        console.error('Error saving schedules:', error);
        addLog(`Error saving schedules: ${error.message}`);
    }
}

function loadSchedules() {
    try {
        if (fs.existsSync(SCHEDULES_FILE)) {
            const data = fs.readFileSync(SCHEDULES_FILE, 'utf8');
            systemState.schedules = JSON.parse(data);
            addLog('Schedules loaded from file');
            setupScheduleCronJobs();
        }
    } catch (error) {
        console.error('Error loading schedules:', error);
        addLog(`Error loading schedules: ${error.message}`);
        systemState.schedules = [];
    }
}

// Schedule Management
function setupScheduleCronJobs() {
    // Clear existing cron jobs
    systemState.activeScheduleTimers.forEach(timer => {
        if (timer.destroy) timer.destroy();
    });
    systemState.activeScheduleTimers.clear();

    // Set up cron jobs for active schedules
    systemState.schedules.forEach(schedule => {
        if (schedule.active) {
            const [hours, minutes] = schedule.time.split(':');
            const cronPattern = `${minutes} ${hours} * * *`;
            
            try {
                const task = cron.schedule(cronPattern, () => {
                    executeSchedule(schedule);
                }, {
                    scheduled: true,
                    timezone: "Asia/Colombo" // Adjust to your timezone
                });
                
                systemState.activeScheduleTimers.set(schedule.id, task);
                addLog(`Cron job set for schedule ${schedule.id}: ${schedule.time}`);
            } catch (error) {
                console.error('Error setting up cron job:', error);
                addLog(`Error setting up cron job for schedule ${schedule.id}: ${error.message}`);
            }
        }
    });
}

function executeSchedule(schedule) {
    const command = schedule.action === 'on' ? 'ON' : 'OFF';
    publishMQTT('agri/motor/control', command);
    systemState.motorState = schedule.action === 'on';
    
    addLog(`Schedule executed: ${schedule.action.toUpperCase()} at ${schedule.time}`);
    
    // Handle duration-based schedules
    if (schedule.duration > 0 && schedule.action === 'on') {
        setTimeout(() => {
            publishMQTT('agri/motor/control', 'OFF');
            systemState.motorState = false;
            addLog(`Scheduled motor stopped after ${schedule.duration} minutes`);
        }, schedule.duration * 60000);
    }
}

// API Routes

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get system status
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        data: {
            mqttConnected: systemState.mqttConnected,
            motorState: systemState.motorState,
            sensorData: systemState.sensorData,
            timestamp: new Date().toISOString()
        }
    });
});

// Get sensor data
app.get('/api/sensors', (req, res) => {
    res.json({
        success: true,
        data: systemState.sensorData
    });
});

// Get logs
app.get('/api/logs', (req, res) => {
    res.json({
        success: true,
        data: systemState.logs
    });
});

// Motor control
app.post('/api/motor/control', (req, res) => {
    const { action } = req.body;
    
    if (!['on', 'off'].includes(action)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid action. Use "on" or "off"'
        });
    }
    
    const command = action === 'on' ? 'ON' : 'OFF';
    publishMQTT('agri/motor/control', command);
    systemState.motorState = action === 'on';
    
    addLog(`Motor ${action} command sent`);
    
    res.json({
        success: true,
        data: {
            motorState: systemState.motorState,
            message: `Motor turned ${action}`
        }
    });
});

// Emergency stop
app.post('/api/motor/emergency-stop', (req, res) => {
    publishMQTT('agri/motor/emergency', 'STOP');
    systemState.motorState = false;
    
    addLog('Emergency stop activated');
    
    res.json({
        success: true,
        data: {
            motorState: systemState.motorState,
            message: 'Emergency stop activated'
        }
    });
});

// Schedule management
app.get('/api/schedules', (req, res) => {
    res.json({
        success: true,
        data: systemState.schedules
    });
});

app.post('/api/schedules', (req, res) => {
    const { time, action, duration } = req.body;
    
    if (!time || !action) {
        return res.status(400).json({
            success: false,
            error: 'Time and action are required'
        });
    }
    
    if (!['on', 'off'].includes(action)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid action. Use "on" or "off"'
        });
    }
    
    const schedule = {
        id: Date.now(),
        time: time,
        action: action,
        duration: parseInt(duration) || 0,
        active: true,
        createdAt: new Date().toISOString()
    };
    
    systemState.schedules.push(schedule);
    saveSchedules();
    setupScheduleCronJobs();
    
    addLog(`Schedule added: ${action.toUpperCase()} at ${time}`);
    
    res.json({
        success: true,
        data: schedule
    });
});

app.delete('/api/schedules/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = systemState.schedules.length;
    
    systemState.schedules = systemState.schedules.filter(s => s.id !== id);
    
    if (systemState.schedules.length < initialLength) {
        saveSchedules();
        setupScheduleCronJobs();
        addLog(`Schedule deleted (ID: ${id})`);
        res.json({
            success: true,
            message: 'Schedule deleted successfully'
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Schedule not found'
        });
    }
});

// Simulate sensor data (for testing without real sensors)
function simulateSensorData() {
    setInterval(() => {
        systemState.sensorData.temperature = (20 + Math.random() * 15).toFixed(1);
        systemState.sensorData.humidity = (40 + Math.random() * 40).toFixed(0);
        systemState.sensorData.lastUpdated = new Date();
        
        // Publish simulated data
        // publishMQTT('agri/sensors/temperature', systemState.sensorData.temperature);
        // publishMQTT('agri/sensors/humidity', systemState.sensorData.humidity);
        publishMQTT('agri/device/status','on');
    }, 10000); // Update every 10 seconds
}

// Initialize system
function initializeSystem() {
    console.log('Initializing Agricultural IoT Platform...');
    addLog('System initializing...');
    
    // Load existing schedules
    loadSchedules();
    
    // Start sensor simulation (remove this when using real sensors)
    simulateSensorData();
    
    addLog('System initialized successfully');
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`MQTT Broker: ${MQTT_BROKER}`);
    addLog(`Server started on port ${PORT}`);
    
    initializeSystem();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    addLog('System shutting down...');
    
    // Clean up cron jobs
    systemState.activeScheduleTimers.forEach(timer => {
        if (timer.destroy) timer.destroy();
    });
    
    // Close MQTT connection
    if (mqttClient) {
        mqttClient.end();
    }
    
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    addLog(`Uncaught Exception: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    addLog(`Unhandled Rejection: ${reason}`);
});