# Database Architecture - Multi-Farm System

**Last Updated:** October 10, 2025
**Status:** ✅ Models Updated - Ready for Implementation

## 🏗️ Architecture Overview

### **Hierarchical Data Structure**

```
User (1) → (Many) Farms
  └── Farm (1) → (Many) Schedules
  └── Farm (1) → (Many) Irrigation History Records
  └── Farm (1:1) Sensor Data (embedded)
  └── Farm (1:1) Motor Status (embedded)
```

## 📊 Database Collections

### **1. Users Collection**
**Purpose:** User authentication and profile management

```javascript
{
  _id: ObjectId("..."),
  phoneNumber: "0777777777",        // Unique, 10 digits
  firstName: "John",
  lastName: "Doe",
  email: "user0777777777@agriiot.com",
  password: "$2a$12$...",            // Hashed with bcrypt
  role: "user",                      // or "admin"
  isActive: true,
  lastLogin: ISODate("2025-10-10..."),
  createdAt: ISODate("2025-10-10..."),
  updatedAt: ISODate("2025-10-10...")
}
```

**Indexes:**
- `phoneNumber` (unique)
- `email` (unique)

---

### **2. Farms Collection** ⭐ NEW STRUCTURE
**Purpose:** Farm/Device management with real-time data

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),          // Owner reference
  farmName: "My Farm",
  deviceName: "SAB80SO0095",

  // Real-time sensor data (embedded)
  sensorData: {
    temperature: 28.5,               // °C
    humidity: 65.3,                  // %
    lastUpdated: ISODate("...")      // Last sensor reading time
  },

  // Motor status (embedded)
  motorStatus: {
    isOn: false,                     // true = running, false = stopped
    lastChanged: ISODate("...")      // Last motor state change
  },

  // Device connectivity (embedded)
  deviceStatus: {
    isOnline: true,                  // Device connection status
    lastSeen: ISODate("...")         // Last heartbeat/data received
  },

  isActive: true,                    // Soft delete flag
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**Indexes:**
- `userId, createdAt` (compound - get user's farms)
- `userId, isActive` (find active farms)

**Key Features:**
- ✅ **Embedded sensor data** - No separate collection needed, faster queries
- ✅ **Embedded motor status** - Real-time motor state per farm
- ✅ **Device connectivity** - Track which farms are online/offline
- ✅ **Soft deletes** - `isActive: false` instead of permanent deletion

---

### **3. Schedules Collection** ⭐ UPDATED
**Purpose:** Irrigation schedules per farm

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),          // Owner reference
  farmId: ObjectId("..."),          // Farm reference ⭐ NEW

  time: "08:00",                     // HH:MM format
  action: "on",                      // "on" or "off"
  duration: 30,                      // Minutes
  frequency: "daily",                // "daily" or "weekly"
  date: "2025-10-15",               // For weekly schedules only

  active: true,                      // Schedule enabled/disabled
  lastExecuted: ISODate("..."),      // Last execution time

  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**Indexes:**
- `userId, farmId` (compound - get farm's schedules)
- `farmId, active` (find active schedules for a farm)
- `time, active` (cron job optimization)

**Benefits:**
- ✅ Each farm has its own schedules
- ✅ User can have multiple farms with different schedules
- ✅ Schedules don't interfere between farms

---

### **4. Irrigation History Collection** ⭐ UPDATED
**Purpose:** Track all irrigation events per farm

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),          // Owner reference
  farmId: ObjectId("..."),          // Farm reference ⭐ NEW

  action: "COMPLETED",               // "COMPLETED", "ON", "OFF"
  source: "schedule",                // "manual", "schedule", "device_confirm"
  duration: 30,                      // Minutes

  // Schedule reference (if from schedule)
  scheduleId: ObjectId("..."),
  scheduleDetails: {
    frequency: "daily",
    date: "2025-10-15",
    time: "08:00"
  },

  // Sensor data snapshot at irrigation time
  sensorData: {
    temperature: 28.5,
    humidity: 65.3
  },

  startTime: ISODate("..."),
  endTime: ISODate("..."),

  createdAt: ISODate("..."),         // = timestamp
  updatedAt: ISODate("...")
}
```

**Indexes:**
- `userId, farmId, createdAt` (compound - get farm's history)
- `farmId, createdAt` (recent history for specific farm)
- `createdAt` (global recent history)
- `source, createdAt` (filter by source type)

**Benefits:**
- ✅ Complete irrigation tracking per farm
- ✅ Historical sensor data preserved
- ✅ Schedule details captured for audit
- ✅ Easy filtering by farm, user, or source

---

## 🔐 Data Isolation Strategy

### **User-Level Isolation**
```
User A:
  └── Farm A1 (sensor data, motor, schedules, history)
  └── Farm A2 (sensor data, motor, schedules, history)

User B:
  └── Farm B1 (sensor data, motor, schedules, history)
```

**How It Works:**
1. Every farm belongs to exactly ONE user (`userId`)
2. Every schedule belongs to ONE user and ONE farm (`userId`, `farmId`)
3. Every history record belongs to ONE user and ONE farm (`userId`, `farmId`)
4. API routes verify ownership before allowing access

### **Security Checks**
```javascript
// Example: Get farm schedules
router.get('/farms/:farmId/schedules', verifyToken, async (req, res) => {
  const farmId = req.params.farmId;
  const userId = req.user.userId;

  // 1. Verify farm ownership
  const farm = await Farm.findOne({ _id: farmId, userId });
  if (!farm) {
    return res.status(404).json({ error: 'Farm not found' });
  }

  // 2. Get schedules for this farm only
  const schedules = await Schedule.findByFarmId(farmId);
  res.json({ data: schedules });
});
```

---

## 📍 API Endpoints Structure

### **Farm Management**
```
GET    /api/farms                    # Get user's farms
POST   /api/farms                    # Create new farm
GET    /api/farms/:farmId            # Get specific farm details
PUT    /api/farms/:farmId            # Update farm
DELETE /api/farms/:farmId            # Delete farm (soft)
```

### **Farm-Specific Data**
```
GET    /api/farms/:farmId/schedules          # Get farm's schedules
POST   /api/farms/:farmId/schedules          # Create schedule for farm
PUT    /api/farms/:farmId/schedules/:id      # Update schedule
DELETE /api/farms/:farmId/schedules/:id      # Delete schedule

GET    /api/farms/:farmId/history            # Get farm's irrigation history
GET    /api/farms/:farmId/sensor-data        # Get current sensor readings
POST   /api/farms/:farmId/motor/control      # Control farm's motor
```

### **Multi-Farm Endpoints**
```
GET    /api/schedules                # Get all schedules across all user's farms
GET    /api/history                  # Get irrigation history across all farms
GET    /api/dashboard                # Dashboard data for all farms
```

---

## 🎯 Benefits of This Architecture

### **1. Complete Data Isolation**
- ✅ User A cannot see or modify User B's farms
- ✅ Each farm has isolated schedules and history
- ✅ No cross-contamination of data

### **2. Scalability**
- ✅ Users can have unlimited farms
- ✅ Each farm has unlimited schedules and history
- ✅ Efficient queries with proper indexes
- ✅ Data grows linearly with usage

### **3. Performance**
- ✅ Embedded sensor data (no joins needed)
- ✅ Indexed foreign keys (`userId`, `farmId`)
- ✅ Optimized queries for common operations
- ✅ Fast farm-specific data retrieval

### **4. Maintainability**
- ✅ Clear data hierarchy
- ✅ Easy to understand relationships
- ✅ Consistent schema across collections
- ✅ Simple backup and restore

### **5. Flexibility**
- ✅ Each farm can have different configurations
- ✅ Independent schedules per farm
- ✅ Separate history tracking per farm
- ✅ Easy to add new farm types/features

---

## 🔄 MQTT Message Routing

### **Challenge**
MQTT messages need to be routed to the correct farm based on device identifier.

### **Solution: Device ID Mapping**

```javascript
// Option 1: Device ID in topic
// Topic: agri/SAB80SO0095/temperature
// Parse device ID from topic, lookup farmId

// Option 2: Store device ID in Farm model
{
  farmName: "My Farm",
  deviceName: "SAB80SO0095",
  mqttTopics: {
    temperature: "agri/SAB80SO0095/temperature",
    humidity: "agri/SAB80SO0095/humidity",
    motor: "agri/SAB80SO0095/motor/status"
  }
}

// Option 3: Device ID mapping collection (if complex)
{
  deviceId: "SAB80SO0095",
  farmId: ObjectId("..."),
  userId: ObjectId("...")
}
```

**Recommended:** Option 2 - Store topics in Farm model for flexibility

---

## 📈 Sample Queries

### **Get User's Farm with Latest Data**
```javascript
const farm = await Farm.findOne({ _id: farmId, userId });
// Returns farm with embedded sensor data and motor status
```

### **Get Farm's Schedules**
```javascript
const schedules = await Schedule.findByFarmId(farmId);
// Returns only this farm's schedules, sorted by time
```

### **Get Farm's Recent History**
```javascript
const history = await IrrigationHistory.getByFarmId(farmId, 50, 1);
// Returns 50 most recent irrigation events for this farm
```

### **Get All Farms for User with Stats**
```javascript
const farms = await Farm.find({ userId, isActive: true });
for (const farm of farms) {
  farm.scheduleCount = await Schedule.countDocuments({ farmId: farm._id, active: true });
  farm.historyCount = await IrrigationHistory.getTotalCount(farm._id);
}
```

---

## ✅ Implementation Checklist

### **Database Models**
- [x] User model (already implemented)
- [x] Farm model (updated with sensor data, motor status)
- [x] Schedule model (updated with farmId)
- [x] IrrigationHistory model (updated with farmId)

### **API Routes** (Next Step)
- [ ] Farm CRUD routes (`/api/farms`)
- [ ] Farm-specific schedule routes (`/api/farms/:farmId/schedules`)
- [ ] Farm-specific history routes (`/api/farms/:farmId/history`)
- [ ] Farm motor control (`/api/farms/:farmId/motor/control`)
- [ ] Farm sensor data (`/api/farms/:farmId/sensor-data`)

### **MQTT Integration** (Next Step)
- [ ] Route MQTT messages to correct farm
- [ ] Update farm's sensor data in real-time
- [ ] Update farm's motor status
- [ ] Update farm's device connectivity

### **Frontend** (Next Step)
- [ ] Farm selection dropdown
- [ ] Display data for selected farm
- [ ] Switch between farms
- [ ] Create/edit/delete farms

---

## 🎓 Migration from Old System

### **Old System** (Global Data)
```
- All users see same sensor data
- All users see same schedules
- All users see same motor status
- No farm concept
```

### **New System** (Farm-Based)
```
- Each user has their own farms
- Each farm has isolated data
- Each farm has own schedules
- Each farm has own history
```

### **Migration Steps**
1. ✅ Update models with farmId
2. ⏳ Create API routes for farm-specific data
3. ⏳ Update MQTT handlers to route by farm
4. ⏳ Update frontend to show farm selection
5. ⏳ Migrate existing schedules/history to default farm

---

## 🚀 Next Steps

1. **Implement farm-specific API routes**
   - Schedule management per farm
   - History retrieval per farm
   - Motor control per farm

2. **Update MQTT handlers**
   - Route messages to correct farm
   - Update farm's embedded data

3. **Update frontend**
   - Farm selector component
   - Display data for selected farm
   - Switch between farms seamlessly

4. **Testing**
   - Multi-user scenarios
   - Multi-farm per user
   - Data isolation verification

---

**Architecture Complete!** This structure provides complete data isolation, scalability, and flexibility for multi-farm IoT management. 🎉
