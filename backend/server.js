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
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://senzmate.com:1883';
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
        temperature: 0,
        humidity: 0,
        lastUpdated: new Date()
    },
    schedules: [],
    logs: [],
    activeScheduleTimers: new Map(),
    lastSensorDataTime: null,  // Track when we last received sensor data
    deviceActive: false        // Track if device is actively sending data
};

// Server-Sent Events connections
let sseConnections = [];

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
    // Detailed logging for all MQTT messages
    console.log('==============================');
    console.log(`[MQTT] Topic: ${topic}`);
    console.log(`[MQTT] Payload: ${payload}`);
    console.log(`[MQTT] Timestamp: ${new Date().toISOString()}`);
    console.log('==============================');

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
            const temperature = parseFloat(payload);
            if (!isNaN(temperature)) {
                systemState.sensorData.temperature = temperature;
                systemState.sensorData.lastUpdated = new Date();
                systemState.lastSensorDataTime = new Date();
                systemState.deviceActive = true;
                addLog(`Temperature updated: ${temperature}°C`);
                console.log(`Temperature received via MQTT: ${temperature}°C`);
                
                // Broadcast to all SSE connections
                broadcastSensorData();
            } else {
                addLog(`Invalid temperature value received: ${payload}`);
                console.log(`Invalid temperature value: ${payload}`);
            }
            break;
            
        case 'agri/sensors/humidity':
            const humidity = parseFloat(payload);
            if (!isNaN(humidity)) {
                systemState.sensorData.humidity = humidity;
                systemState.sensorData.lastUpdated = new Date();
                systemState.lastSensorDataTime = new Date();
                systemState.deviceActive = true;
                addLog(`Humidity updated: ${humidity}%`);
                console.log(`Humidity received via MQTT: ${humidity}%`);
                
                // Broadcast to all SSE connections
                broadcastSensorData();
            } else {
                addLog(`Invalid humidity value received: ${payload}`);
                console.log(`Invalid humidity value: ${payload}`);
            }
            break;
            
        case 'agri/motor/status':
            systemState.motorState = payload === 'ON';
            addLog(`Motor status: ${payload}`);
            console.log(`Motor status received via MQTT: ${payload}`);
            
            // Broadcast motor status to all SSE connections
            broadcastMotorStatus();
            break;
            
        case 'agri/device/status':
            try {
                const deviceStatus = JSON.parse(payload);
                console.log(`Device status received: ${deviceStatus.status}`);
                
                if (deviceStatus.status === 'online') {
                    systemState.deviceActive = true;
                    systemState.lastSensorDataTime = new Date();
                    addLog(`Device came online: ${deviceStatus.device_id}`);
                } else if (deviceStatus.status === 'offline') {
                    systemState.deviceActive = false;
                    systemState.lastSensorDataTime = null;
                    addLog(`Device went offline: ${deviceStatus.device_id}`);
                }
                
                // Update mqttConnected status based on device activity
                systemState.mqttConnected = systemState.deviceActive;
                
                // Broadcast status update
                broadcastStatusUpdate();
            } catch (error) {
                console.error('Error parsing device status:', error);
                addLog(`Error parsing device status: ${error.message}`);
            }
            break;
            
        default:
            console.log(`Unhandled MQTT topic: ${topic}, payload: ${payload}`);
            addLog(`Unhandled MQTT message on topic: ${topic}`);
    }
}

// Device Activity Monitoring
setInterval(() => {
    const now = new Date();
    const deviceTimeout = 15000; // 15 seconds timeout
    
    if (systemState.lastSensorDataTime) {
        const timeSinceLastData = now - systemState.lastSensorDataTime;
        
        if (timeSinceLastData > deviceTimeout && systemState.deviceActive) {
            systemState.deviceActive = false;
            systemState.mqttConnected = false; // Update mqttConnected status
            addLog('Device went offline - no sensor data received');
            console.log('Device detected as inactive - no sensor data for 15 seconds');
            
            // Broadcast device status change
            broadcastStatusUpdate();
        }
    }
}, 5000); // Check every 5 seconds

// Device Management Functions
// SSE Connection Management
function cleanupConnection(connectionId) {
    const initialLength = sseConnections.length;
    sseConnections = sseConnections.filter(conn => conn.id !== connectionId);
    
    if (sseConnections.length < initialLength) {
        console.log(`SSE connection cleaned up: ${connectionId}. Total connections: ${sseConnections.length}`);
    }
}

// Periodic cleanup of stale connections
setInterval(() => {
    const now = new Date();
    const activeConnections = [];
    
    sseConnections.forEach(conn => {
        const isDestroyed = conn.response.destroyed || conn.response.writableEnded;
        const isOld = now - conn.created > 120000; // 2 minutes old
        
        if (isDestroyed || isOld) {
            try {
                if (!conn.response.destroyed) {
                    conn.response.end();
                }
            } catch (error) {
                // Ignore cleanup errors
            }
            console.log(`Cleaned up stale SSE connection: ${conn.id}`);
        } else {
            activeConnections.push(conn);
        }
    });
    
    const removedCount = sseConnections.length - activeConnections.length;
    sseConnections = activeConnections;
    
    if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} stale SSE connections. Active: ${sseConnections.length}`);
    }
}, 30000); // Run cleanup every 30 seconds

// Broadcast functions for Server-Sent Events
function broadcastSensorData() {
    const data = {
        type: 'sensorData',
        temperature: systemState.sensorData.temperature,
        humidity: systemState.sensorData.humidity,
        lastUpdated: systemState.sensorData.lastUpdated.toISOString()
    };
    
    console.log('Broadcasting sensor data via SSE:', data);
    broadcastToSSE(data);
}

function broadcastMotorStatus() {
    const data = {
        type: 'motorStatus',
        motorState: systemState.motorState
    };
    
    broadcastToSSE(data);
}

function broadcastStatusUpdate() {
    const data = {
        type: 'statusUpdate',
        mqttConnected: systemState.mqttConnected,
        deviceActive: systemState.deviceActive,
        lastSensorDataTime: systemState.lastSensorDataTime
    };
    
    console.log('Broadcasting status update via SSE:', data);
    broadcastToSSE(data);
}

function broadcastToSSE(data) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    
    // Remove closed connections and send to active ones
    const activeConnections = [];
    
    sseConnections.forEach(conn => {
        if (conn.response.destroyed || conn.response.writableEnded) {
            console.log(`Removing dead connection: ${conn.id}`);
            return; // Skip dead connections
        }
        
        try {
            conn.response.write(message);
            activeConnections.push(conn);
        } catch (error) {
            console.log(`Error sending SSE message to ${conn.id}:`, error.message);
            // Don't add to active connections
        }
    });
    
    // Update connections list with only active ones
    sseConnections = activeConnections;
    
    if (activeConnections.length > 0) {
        console.log(`SSE broadcast sent to ${activeConnections.length} connections:`, data.type);
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

// Server-Sent Events endpoint for real-time data
app.get('/api/events', (req, res) => {
    // Limit maximum connections to prevent memory leaks
    if (sseConnections.length > 50) {
        console.log(`SSE connection rejected: Too many connections (${sseConnections.length})`);
        res.status(503).json({ error: 'Too many connections' });
        return;
    }

    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Add this connection to our list
    const connectionId = Date.now() + Math.random();
    const connection = {
        id: connectionId,
        response: res,
        created: new Date()
    };
    
    sseConnections.push(connection);
    console.log(`SSE connection opened: ${connectionId}. Total connections: ${sseConnections.length}`);

    // Send initial data
    const initialData = {
        type: 'initial',
        sensorData: {
            temperature: systemState.sensorData.temperature,
            humidity: systemState.sensorData.humidity,
            lastUpdated: systemState.sensorData.lastUpdated.toISOString()
        },
        motorState: systemState.motorState,
        mqttConnected: systemState.deviceActive // Use deviceActive as the real connection status
    };
    
    try {
        res.write(`data: ${JSON.stringify(initialData)}\n\n`);
    } catch (error) {
        console.log(`Error sending initial data to ${connectionId}:`, error.message);
        cleanupConnection(connectionId);
        return;
    }

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
        if (res.destroyed || res.writableEnded) {
            clearInterval(heartbeat);
            cleanupConnection(connectionId);
            return;
        }
        
        try {
            res.write(`data: {"type":"heartbeat","timestamp":"${new Date().toISOString()}"}\n\n`);
        } catch (error) {
            console.log(`Error sending heartbeat to ${connectionId}:`, error.message);
            clearInterval(heartbeat);
            cleanupConnection(connectionId);
        }
    }, 30000); // Send heartbeat every 30 seconds

    // Handle client disconnect
    const cleanup = () => {
        clearInterval(heartbeat);
        cleanupConnection(connectionId);
    };

    req.on('close', cleanup);
    req.on('error', cleanup);
    res.on('error', cleanup);
    res.on('finish', cleanup);
});

// Get system status
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        data: {
            mqttConnected: systemState.deviceActive, // Use deviceActive as the real connection status
            motorState: systemState.motorState,
            sensorData: systemState.sensorData,
            deviceActive: systemState.deviceActive,
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

// Clear all SSE connections (for debugging)
app.post('/api/clear-connections', (req, res) => {
    const count = sseConnections.length;
    sseConnections.forEach(conn => {
        try {
            if (!conn.response.destroyed) {
                conn.response.end();
            }
        } catch (error) {
            // Ignore errors when closing connections
        }
    });
    sseConnections = [];
    
    res.json({
        success: true,
        message: `Cleared ${count} SSE connections`
    });
});

// Test endpoint to simulate device status (for testing without real MQTT device)
app.post('/api/test/device-status', (req, res) => {
    const { device_id, device_name, status, location, ip_address } = req.body;
    
    try {
        const deviceInfo = {
            device_id: device_id || 'test-device-001',
            device_name: device_name || 'Test IoT Device',
            location: location || 'Greenhouse 1',
            status: status || 'ONLINE',
            capabilities: ['temperature', 'humidity', 'motor_control'],
            timestamp: new Date().toISOString(),
            ip_address: ip_address || '192.168.1.100',
            version: '1.0.0'
        };
        
        handleDeviceStatus(deviceInfo);
        
        res.json({
            success: true,
            message: 'Test device status sent',
            data: deviceInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to process test device status',
            message: error.message
        });
    }
});

// Test endpoint to simulate MQTT sensor data (for testing without real MQTT broker)
app.post('/api/test/sensor-data', (req, res) => {
    const { temperature, humidity } = req.body;
    
    try {
        if (temperature !== undefined) {
            handleMQTTMessage('agri/sensors/temperature', temperature.toString());
        }
        
        if (humidity !== undefined) {
            handleMQTTMessage('agri/sensors/humidity', humidity.toString());
        }
        
        res.json({
            success: true,
            message: 'Test sensor data sent',
            data: {
                temperature: temperature !== undefined ? temperature : 'not updated',
                humidity: humidity !== undefined ? humidity : 'not updated',
                currentSensorData: systemState.sensorData
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to process test sensor data',
            message: error.message
        });
    }
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

// Initialize system
function initializeSystem() {
    console.log('Initializing Agricultural IoT Platform...');
    addLog('System initializing...');
    
    // Load existing schedules
    loadSchedules();
    
    // Sensor simulation removed - use external MQTT simulator or real sensors
    console.log('Ready to receive MQTT sensor data...');
    
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
