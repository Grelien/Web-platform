// server.js - Optimized Agricultural IoT Platform Backend

const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const cron = require('node-cron');
const helmet = require('helmet');

// Import authentication routes and middleware
const authRoutes = require('./routes/auth');
const { verifyToken, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Middleware with optimization
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public', { maxAge: '1d' }));

// Authentication routes
app.use('/api/auth', authRoutes);

// Configuration
const config = {
    MQTT_BROKER: process.env.MQTT_BROKER || 'mqtt://senzmate.com:1883',
    MQTT_USERNAME: process.env.MQTT_USERNAME || '',
    MQTT_PASSWORD: process.env.MQTT_PASSWORD || '',
    MAX_HISTORY_EVENTS: 500,
    MAX_LOG_ENTRIES: 100,
    SAVE_INTERVAL: 10000, // 10 seconds
    SENSOR_TIMEOUT: 300000 // 5 minutes
};

// Data file paths
const SCHEDULES_FILE = path.join(__dirname, 'data', 'schedules.json');
const IRRIGATION_HISTORY_FILE = path.join(__dirname, 'data', 'irrigation-history.json');
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fsSync.existsSync(DATA_DIR)) {
    fsSync.mkdirSync(DATA_DIR, { recursive: true });
}

// Optimized System State with data validation
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
    irrigationHistory: [],
    activeScheduleTimers: new Map(),
    lastSensorDataTime: null,
    deviceActive: false,
    activeIrrigationSession: null,
    // Performance tracking
    metrics: {
        totalRequests: 0,
        mqttMessages: 0,
        lastSaveTime: Date.now()
    }
};

// Optimized Server-Sent Events connections with cleanup
let sseConnections = new Set();

// Optimized MQTT Client Setup with better error handling
const mqttClient = mqtt.connect(config.MQTT_BROKER, {
    username: config.MQTT_USERNAME,
    password: config.MQTT_PASSWORD,
    clientId: `agri-iot-${Date.now()}-${Math.random().toString(16).substring(2, 8)}`,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    keepalive: 60,
    clean: true,
    qos: 1
});

// Optimized MQTT Event Handlers with throttling
const mqttTopics = [
    'agri/sensors/temperature',
    'agri/sensors/humidity', 
    'agri/motor/status',
    'agri/device/status'
];

mqttClient.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    systemState.mqttConnected = true;
    addLog('MQTT client connected to broker');
    
    // Batch subscribe to topics
    mqttClient.subscribe(mqttTopics, { qos: 1 }, (err) => {
        if (err) {
            console.error('❌ Failed to subscribe to topics:', err);
            addLog(`Failed to subscribe: ${err.message}`);
        } else {
            console.log('📡 Subscribed to all MQTT topics');
            addLog(`Subscribed to ${mqttTopics.length} MQTT topics`);
        }
    });
});

mqttClient.on('message', (topic, message) => {
    const payload = message.toString();
    console.log(`[MQTT] ${topic}: ${payload}`);

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

// Optimized MQTT Message Handler
const mqttMessageHandlers = {
    'agri/sensors/temperature': (payload) => {
        const temperature = parseFloat(payload);
        if (!isNaN(temperature)) {
            systemState.sensorData.temperature = temperature;
            systemState.sensorData.lastUpdated = new Date();
            systemState.lastSensorDataTime = new Date();
            systemState.deviceActive = true;
            broadcastSensorData();
        }
    },
    
    'agri/sensors/humidity': (payload) => {
        const humidity = parseFloat(payload);
        if (!isNaN(humidity)) {
            systemState.sensorData.humidity = humidity;
            systemState.sensorData.lastUpdated = new Date();
            systemState.lastSensorDataTime = new Date();
            systemState.deviceActive = true;
            broadcastSensorData();
        }
    },
    
    'agri/motor/status': (payload) => {
        try {
            const motorStatus = JSON.parse(payload);
            const newMotorState = motorStatus.status === 'ON';
            const oldMotorState = systemState.motorState;
            
            systemState.motorState = newMotorState;
            addLog(`Motor confirmed: ${motorStatus.status}`);
            
            if (oldMotorState !== newMotorState) {
                handleIrrigationStateChange(newMotorState);
            }
        } catch (error) {
            const newMotorState = payload === 'ON';
            const oldMotorState = systemState.motorState;
            
            systemState.motorState = newMotorState;
            addLog(`Motor confirmed: ${payload}`);
            
            if (oldMotorState !== newMotorState) {
                handleIrrigationStateChange(newMotorState);
            }
        }
        broadcastMotorStatus();
    },
    
    'agri/device/status': (payload) => {
        try {
            const deviceStatus = JSON.parse(payload);
            const isOnline = deviceStatus.status === 'online';
            
            systemState.deviceActive = isOnline;
            systemState.mqttConnected = isOnline;
            systemState.lastSensorDataTime = isOnline ? new Date() : null;
            
            addLog(`Device ${isOnline ? 'online' : 'offline'}: ${deviceStatus.device_id}`);
            broadcastStatusUpdate();
        } catch (error) {
            console.error('Error parsing device status:', error);
        }
    }
};

// Handle MQTT Messages - Optimized
function handleMQTTMessage(topic, payload) {
    const handler = mqttMessageHandlers[topic];
    if (handler) {
        handler(payload);
    } else {
        console.log(`Unhandled MQTT topic: ${topic}, payload: ${payload}`);
    }
}

// Device Activity Monitoring
setInterval(() => {
    if (systemState.lastSensorDataTime && systemState.deviceActive) {
        const timeSinceLastData = Date.now() - systemState.lastSensorDataTime;
        
        if (timeSinceLastData > 15000) { // 15 seconds timeout
            systemState.deviceActive = false;
            systemState.mqttConnected = false;
            addLog('Device went offline - timeout');
            broadcastStatusUpdate();
        }
    }
}, 5000);

// SSE Connection Management
function cleanupConnection(connectionId) {
    const initialLength = sseConnections.length;
    sseConnections = sseConnections.filter(conn => conn.id !== connectionId);
    
    if (sseConnections.length < initialLength) {
        console.log(`SSE connection cleaned up: ${connectionId}`);
    }
}

// Periodic cleanup of stale SSE connections
setInterval(() => {
    const now = Date.now();
    const activeConnections = sseConnections.filter(conn => {
        const isStale = conn.response.destroyed || conn.response.writableEnded || 
                       (now - conn.created.getTime()) > 120000; // 2 minutes old
        
        if (isStale && !conn.response.destroyed) {
            try { conn.response.end(); } catch (error) { /* ignore */ }
        }
        
        return !isStale;
    });
    
    if (sseConnections.length !== activeConnections.length) {
        console.log(`Cleaned up ${sseConnections.length - activeConnections.length} stale SSE connections`);
        sseConnections = activeConnections;
    }
}, 30000);

// Broadcast functions for Server-Sent Events
function broadcastSensorData() {
    broadcastToSSE({
        type: 'sensorData',
        temperature: systemState.sensorData.temperature,
        humidity: systemState.sensorData.humidity,
        lastUpdated: systemState.sensorData.lastUpdated.toISOString()
    });
}

function broadcastMotorStatus() {
    broadcastToSSE({
        type: 'motorStatus',
        motorState: systemState.motorState
    });
}

function broadcastStatusUpdate() {
    broadcastToSSE({
        type: 'statusUpdate',
        mqttConnected: systemState.mqttConnected,
        deviceActive: systemState.deviceActive,
        lastSensorDataTime: systemState.lastSensorDataTime
    });
}

function broadcastToSSE(data) {
    if (sseConnections.length === 0) return;
    
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const activeConnections = [];
    
    sseConnections.forEach(conn => {
        if (!conn.response.destroyed && !conn.response.writableEnded) {
            try {
                conn.response.write(message);
                activeConnections.push(conn);
            } catch (error) {
                // Connection failed, don't add to active list
            }
        }
    });
    
    sseConnections = activeConnections;
}

// Optimized Utility Functions
function addLog(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { 
        time: timestamp, 
        message,
        level
    };
    
    systemState.logs.unshift(logEntry);
    
    // Keep only recent logs with better memory management
    if (systemState.logs.length > config.MAX_LOG_ENTRIES) {
        systemState.logs = systemState.logs.slice(0, config.MAX_LOG_ENTRIES);
    }
    
    // Only log errors and warnings to console in production
    if (process.env.NODE_ENV !== 'production' || level !== 'info') {
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }
}

function publishMQTT(topic, message) {
    if (!systemState.mqttConnected) {
        addLog('Cannot publish: MQTT not connected', 'warn');
        return Promise.reject(new Error('MQTT not connected'));
    }
    
    return new Promise((resolve, reject) => {
        mqttClient.publish(topic, message, { qos: 1 }, (err) => {
            systemState.metrics.mqttMessages++;
            if (err) {
                addLog(`Failed to publish to ${topic}: ${err.message}`, 'error');
                reject(err);
            } else {
                addLog(`Published to ${topic}: ${message}`);
                resolve();
            }
        });
    });
}// Irrigation Session Management - Optimized
const sessionManager = {
    activeSession: null,
    
    start(source, scheduleId = null, scheduleDetails = null) {
        if (this.activeSession) {
            console.log(`⚠️ Ending previous session before starting new one`);
            this.end();
        }
        
        this.activeSession = {
            startTime: new Date().toISOString(),
            source,
            scheduleId,
            scheduleDetails
        };
        
        console.log(`🚀 Started irrigation session:`, this.activeSession);
    },
    
    end() {
        if (!this.activeSession) return null;
        
        const session = this.activeSession;
        const endTime = new Date();
        const startTime = new Date(session.startTime);
        const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
        
        const irrigationEvent = {
            id: `irrigation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: session.startTime,
            endTime: endTime.toISOString(),
            action: 'COMPLETED',
            source: session.source,
            duration: durationMinutes,
            scheduleId: session.scheduleId,
            scheduleDetails: session.scheduleDetails
        };
        
        // Add to history
        systemState.irrigationHistory.unshift(irrigationEvent);
        
        // Limit history size
        if (systemState.irrigationHistory.length > 500) {
            systemState.irrigationHistory = systemState.irrigationHistory.slice(0, 500);
        }
        
        // Auto-save every 5 events instead of 10
        if (systemState.irrigationHistory.length % 5 === 0) {
            this.saveHistory();
        }
        
        // Log and broadcast
        const scheduleInfo = session.scheduleDetails ? 
            ` (${session.scheduleDetails.frequency}${session.scheduleDetails.date ? ` - ${session.scheduleDetails.date}` : ''})` : '';
        addLog(`Irrigation completed: ${session.source}${scheduleInfo} - ${durationMinutes} minutes`);
        
        broadcastIrrigationEvent(irrigationEvent);
        
        this.activeSession = null;
        return irrigationEvent;
    },
    
    saveHistory() {
        try {
            fs.writeFileSync(IRRIGATION_HISTORY_FILE, JSON.stringify(systemState.irrigationHistory, null, 2));
            console.log(`💾 Saved ${systemState.irrigationHistory.length} irrigation events`);
        } catch (error) {
            console.error('Error saving irrigation history:', error);
        }
    }
};

function handleIrrigationStateChange(isOn) {
    if (isOn) {
        // Motor turned ON - start tracking session
        if (!systemState.activeIrrigationSession) {
            systemState.activeIrrigationSession = {
                startTime: new Date().toISOString(),
                source: 'manual',
                scheduleId: null,
                scheduleDetails: null
            };
            console.log(`� Started irrigation session:`, systemState.activeIrrigationSession);
        }
    } else {
        // Motor turned OFF - complete session
        sessionManager.end();
    }
}

function startIrrigationSession(source, scheduleId = null, scheduleDetails = null) {
    sessionManager.start(source, scheduleId, scheduleDetails);
}

// Irrigation History Functions
function addIrrigationEvent(action, source, duration = null, scheduleId = null, scheduleDetails = null) {
    console.log(`📊 ADDING IRRIGATION EVENT:`, { action, source, duration, scheduleId, scheduleDetails });
    
    const event = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        action: action, // 'ON' or 'OFF'
        source: source, // 'manual', 'schedule', 'device_confirm'
        duration: duration, // in minutes for scheduled events
        scheduleId: scheduleId, // reference to schedule if applicable
        scheduleDetails: scheduleDetails, // additional schedule info (frequency, date)
        sensorData: {
            temperature: systemState.sensorData.temperature,
            humidity: systemState.sensorData.humidity
        }
    };
    
    console.log(`📝 Created irrigation event:`, event);
    
    systemState.irrigationHistory.unshift(event);
    
    // Keep only last 500 irrigation events
    if (systemState.irrigationHistory.length > 500) {
        systemState.irrigationHistory = systemState.irrigationHistory.slice(0, 500);
    }
    
    console.log(`📊 Irrigation history now has ${systemState.irrigationHistory.length} events`);
    
    // Save to file periodically (every 10 events)
    if (systemState.irrigationHistory.length % 10 === 0) {
        saveIrrigationHistory();
    }
    
    const scheduleInfo = scheduleDetails ? ` (${scheduleDetails.frequency}${scheduleDetails.date ? ` - ${scheduleDetails.date}` : ''})` : '';
    addLog(`Irrigation ${action}: ${source}${duration ? ` (${duration}min)` : ''}${scheduleInfo}`);
    
    // Broadcast irrigation event to frontend
    console.log(`📡 Broadcasting irrigation event to frontend`);
    broadcastIrrigationEvent(event);
}

function broadcastIrrigationEvent(event) {
    broadcastToSSE({
        type: 'irrigationEvent',
        event: event
    });
}

// Optimized File Operations with async/await and batching
let saveSchedulesTimer = null;
let saveHistoryTimer = null;

async function saveSchedules() {
    try {
        await fs.writeFile(SCHEDULES_FILE, JSON.stringify(systemState.schedules, null, 2));
        systemState.metrics.lastSaveTime = Date.now();
        console.log('✅ Schedules saved to file');
    } catch (error) {
        console.error('❌ Error saving schedules:', error);
        addLog(`Error saving schedules: ${error.message}`);
    }
}

async function saveIrrigationHistory() {
    try {
        // Only save recent history to reduce file size
        const recentHistory = systemState.irrigationHistory.slice(0, config.MAX_HISTORY_EVENTS);
        await fs.writeFile(IRRIGATION_HISTORY_FILE, JSON.stringify(recentHistory, null, 2));
        systemState.metrics.lastSaveTime = Date.now();
        console.log('✅ Irrigation history saved to file');
    } catch (error) {
        console.error('❌ Error saving irrigation history:', error);
    }
}

// Debounced save functions to prevent excessive file writes
function debouncedSaveSchedules() {
    if (saveSchedulesTimer) clearTimeout(saveSchedulesTimer);
    saveSchedulesTimer = setTimeout(saveSchedules, 2000);
}

function debouncedSaveHistory() {
    if (saveHistoryTimer) clearTimeout(saveHistoryTimer);
    saveHistoryTimer = setTimeout(saveIrrigationHistory, 2000);
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

function loadIrrigationHistory() {
    try {
        if (fs.existsSync(IRRIGATION_HISTORY_FILE)) {
            const data = fs.readFileSync(IRRIGATION_HISTORY_FILE, 'utf8');
            systemState.irrigationHistory = JSON.parse(data);
            addLog('Irrigation history loaded from file');
        }
    } catch (error) {
        console.error('Error loading irrigation history:', error);
        systemState.irrigationHistory = [];
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
            let cronPattern;
            let scheduleDescription;
            
            // Handle different schedule frequencies
            if (schedule.frequency === 'weekly' && schedule.date) {
                // For weekly schedules, run only on the specified date
                const scheduleDate = new Date(schedule.date);
                const today = new Date();
                
                // Only set up the cron job if the date is today or in the future
                if (scheduleDate >= today.setHours(0,0,0,0)) {
                    const day = scheduleDate.getDate();
                    const month = scheduleDate.getMonth() + 1;
                    cronPattern = `${minutes} ${hours} ${day} ${month} *`;
                    scheduleDescription = `once on ${schedule.date}`;
                } else {
                    // Skip past dates for weekly schedules
                    console.log(`⏰ Skipping past date schedule: ${schedule.date}`);
                    return;
                }
            } else {
                // Daily schedule (default)
                cronPattern = `${minutes} ${hours} * * *`;
                scheduleDescription = 'daily';
            }
            
            console.log(`⏰ CREATING CRON JOB for schedule: ${schedule.name || schedule.id}`);
            console.log(`📅 Cron pattern: ${cronPattern} (${schedule.time} ${scheduleDescription})`);
            
            try {
                const task = cron.schedule(cronPattern, () => {
                    console.log(`🔔 CRON JOB TRIGGERED for schedule: ${schedule.name || schedule.id}`);
                    executeSchedule(schedule);
                    
                    // For weekly schedules, disable after execution
                    if (schedule.frequency === 'weekly') {
                        schedule.active = false;
                        saveSchedules();
                        console.log(`📅 Weekly schedule ${schedule.id} completed and disabled`);
                        addLog(`Weekly schedule ${schedule.id} completed and disabled`);
                    }
                }, {
                    scheduled: true,
                    timezone: "Asia/Colombo" // Adjust to your timezone
                });
                
                systemState.activeScheduleTimers.set(schedule.id, task);
                console.log(`✅ Cron job started for schedule: ${schedule.name || schedule.id}`);
                addLog(`Cron job set for schedule ${schedule.id}: ${schedule.time} ${scheduleDescription}`);
            } catch (error) {
                console.error('❌ Error setting up cron job:', error);
                addLog(`Error setting up cron job for schedule ${schedule.id}: ${error.message}`);
            }
        }
    });
}

function executeSchedule(schedule) {
    console.log(`🚀 EXECUTING SCHEDULE: ${schedule.name || schedule.id} at ${new Date().toISOString()}`);
    console.log(`📋 Schedule details:`, schedule);
    
    const command = schedule.action === 'on' ? 'ON' : 'OFF';
    
    // Prepare schedule details for irrigation session tracking
    const scheduleDetails = {
        frequency: schedule.frequency || 'daily',
        date: schedule.date || null,
        time: schedule.time
    };
    
    // Start irrigation session tracking for schedules - this will create the history entry when complete
    if (command === 'ON') {
        startIrrigationSession('schedule', schedule.id, scheduleDetails);
    }
    
    publishMQTT('agri/motor/control', command);
    
    const dateText = schedule.date ? ` on ${schedule.date}` : '';
    addLog(`Schedule executed: ${schedule.action.toUpperCase()} command sent at ${schedule.time}${dateText}`);
    
    // Handle duration-based schedules (auto-off after duration)
    if (schedule.duration > 0 && schedule.action === 'on') {
        console.log(`⏰ Setting auto-off timer for ${schedule.duration} minutes`);
        setTimeout(() => {
            publishMQTT('agri/motor/control', 'OFF');
            addLog(`Scheduled motor OFF command sent after ${schedule.duration} minutes`);
            // Note: No additional irrigation event created here - session manager handles it
        }, schedule.duration * 60000);
    }
}

// API Routes

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server-Sent Events endpoint
app.get('/api/events', (req, res) => {
    if (sseConnections.length > 50) {
        return res.status(503).json({ error: 'Too many connections' });
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const connectionId = Date.now() + Math.random();
    const connection = {
        id: connectionId,
        response: res,
        created: new Date()
    };
    
    sseConnections.push(connection);
    console.log(`SSE connection opened: ${connectionId}`);

    // Send initial data
    try {
        const initialData = {
            type: 'initial',
            sensorData: {
                temperature: systemState.sensorData.temperature,
                humidity: systemState.sensorData.humidity,
                lastUpdated: systemState.sensorData.lastUpdated.toISOString()
            },
            motorState: systemState.motorState,
            mqttConnected: systemState.deviceActive,
            irrigationHistory: systemState.irrigationHistory.slice(0, 10) // Send last 10 events
        };
        
        res.write(`data: ${JSON.stringify(initialData)}\n\n`);
    } catch (error) {
        cleanupConnection(connectionId);
        return;
    }

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
        if (res.destroyed || res.writableEnded) {
            clearInterval(heartbeat);
            cleanupConnection(connectionId);
            return;
        }
        
        try {
            res.write(`data: {"type":"heartbeat","timestamp":"${new Date().toISOString()}"}\n\n`);
        } catch (error) {
            clearInterval(heartbeat);
            cleanupConnection(connectionId);
        }
    }, 30000);

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

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        data: {
            mqttConnected: systemState.deviceActive,
            motorState: systemState.motorState,
            sensorData: systemState.sensorData,
            deviceActive: systemState.deviceActive,
            timestamp: new Date().toISOString()
        }
    });
});

app.get('/api/sensors', (req, res) => {
    res.json({ success: true, data: systemState.sensorData });
});

app.get('/api/logs', (req, res) => {
    res.json({ success: true, data: systemState.logs });
});

app.get('/api/irrigation-history', (req, res) => {
    const { limit = 50, page = 1 } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    
    const paginatedHistory = systemState.irrigationHistory.slice(startIndex, endIndex);
    
    res.json({
        success: true,
        data: {
            history: paginatedHistory,
            total: systemState.irrigationHistory.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(systemState.irrigationHistory.length / limit)
        }
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
    
    // Start manual irrigation session tracking
    if (command === 'ON') {
        startIrrigationSession('manual');
    }
    
    publishMQTT('agri/motor/control', command);
    systemState.motorState = action === 'on';
    
    console.log(`👤 MANUAL MOTOR CONTROL: ${command}`);
    addLog(`Motor ${action} command sent via API`);
    
    res.json({
        success: true,
        data: {
            motorState: systemState.motorState,
            message: `Motor ${action} command sent`
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
    const { time, action, duration, date, frequency } = req.body;
    
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

    // Validate frequency and date
    const scheduleFrequency = frequency || 'daily';
    if (!['daily', 'weekly'].includes(scheduleFrequency)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid frequency. Use "daily" or "weekly"'
        });
    }

    // For weekly schedules, date is required
    if (scheduleFrequency === 'weekly' && !date) {
        return res.status(400).json({
            success: false,
            error: 'Date is required for weekly schedules'
        });
    }
    
    const schedule = {
        id: Date.now(),
        time: time,
        action: action,
        duration: parseInt(duration) || 0,
        frequency: scheduleFrequency,
        date: date || null, // Only for weekly schedules
        active: true,
        createdAt: new Date().toISOString()
    };
    
    systemState.schedules.push(schedule);
    saveSchedules();
    setupScheduleCronJobs();
    
    const dateText = date ? ` on ${date}` : '';
    addLog(`Schedule added: ${action.toUpperCase()} at ${time}${dateText} (${scheduleFrequency})`);
    
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

// Initialize and start server
function initializeSystem() {
    addLog('System initializing...');
    loadSchedules();
    loadIrrigationHistory();
    addLog('System initialized successfully');
}

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
    
    // Save data before shutdown
    saveIrrigationHistory();
    
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
