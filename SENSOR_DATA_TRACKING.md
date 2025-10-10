# Sensor Data Tracking & Export System

**Last Updated:** October 10, 2025
**Status:** ✅ Complete - Time-Series Data Collection Active

## 📊 Overview

The system now saves **all sensor data history** to MongoDB for:
- Historical analysis
- Excel exports
- Chart generation
- Trend analysis
- Reporting

## 🗄️ Database Collection: `sensordatas`

### **Document Structure**
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),           // Owner
  farmId: ObjectId("..."),           // Which farm
  temperature: 28.5,                 // °C
  humidity: 65.3,                    // %
  timestamp: ISODate("2025-10-10...")
}
```

### **Storage Strategy**
- ✅ **Throttled Saving:** One record every **30 seconds** (configurable)
- ✅ **Time-Series Optimized:** MongoDB time-series collection
- ✅ **Indexed Queries:** Fast retrieval by farm, date range
- ✅ **Auto-Cleanup:** Retention policy (default: 90 days)

### **Why 30 Seconds?**
```
MQTT sends data every 1 second
= 86,400 readings/day
= 31,536,000 readings/year (too much!)

Saving every 30 seconds:
= 2,880 readings/day
= 1,051,200 readings/year (manageable)
```

**You can adjust the interval in `server.js`:**
```javascript
const SAVE_INTERVAL = 30000; // 30 seconds (change this)
```

---

## 🔌 API Endpoints

### **1. Get Sensor Data History**
```http
GET /api/farms/:farmId/sensor-data
Authorization: Bearer <token>

Query Parameters:
- limit: number of readings (default: 100)
- page: page number (default: 1)
- startDate: ISO date string (optional)
- endDate: ISO date string (optional)
```

**Example:**
```bash
# Get last 100 readings
curl http://localhost:3000/api/farms/68e864c800bbe4e6f6eba577/sensor-data \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get data for specific date range
curl "http://localhost:3000/api/farms/68e864c800bbe4e6f6eba577/sensor-data?startDate=2025-10-01&endDate=2025-10-10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "readings": [
      {
        "timestamp": "2025-10-10T10:30:00.000Z",
        "temperature": 28.5,
        "humidity": 65.3
      },
      ...
    ],
    "total": 2880,
    "page": 1,
    "limit": 100,
    "totalPages": 29
  }
}
```

---

### **2. Get Statistics**
```http
GET /api/farms/:farmId/sensor-stats
Authorization: Bearer <token>

Query Parameters:
- period: "24h" | "7d" | "30d" (default: 24h)
- startDate: ISO date (optional)
- endDate: ISO date (optional)
```

**Example:**
```bash
curl http://localhost:3000/api/farms/68e864c800bbe4e6f6eba577/sensor-stats?period=7d \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-10-03T10:00:00.000Z",
      "end": "2025-10-10T10:00:00.000Z"
    },
    "avgTemperature": 27.8,
    "avgHumidity": 64.5,
    "minTemperature": 22.1,
    "maxTemperature": 35.2,
    "minHumidity": 45.0,
    "maxHumidity": 85.3,
    "count": 20160
  }
}
```

---

### **3. Get Chart Data (Hourly Averages)**
```http
GET /api/farms/:farmId/sensor-chart
Authorization: Bearer <token>

Query Parameters:
- hours: number of hours (default: 24)
```

**Example:**
```bash
curl http://localhost:3000/api/farms/68e864c800bbe4e6f6eba577/sensor-chart?hours=48 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "2025-10-10 10:00",
      "avgTemperature": 28.3,
      "avgHumidity": 65.1,
      "count": 120
    },
    {
      "_id": "2025-10-10 11:00",
      "avgTemperature": 29.1,
      "avgHumidity": 63.8,
      "count": 120
    },
    ...
  ]
}
```

---

### **4. Export to Excel/CSV** ⭐
```http
GET /api/farms/:farmId/sensor-export
Authorization: Bearer <token>

Query Parameters:
- format: "csv" | "json" (default: json)
- startDate: ISO date (optional, default: 7 days ago)
- endDate: ISO date (optional, default: now)
```

**Export as CSV (Excel-compatible):**
```bash
curl "http://localhost:3000/api/farms/68e864c800bbe4e6f6eba577/sensor-export?format=csv&startDate=2025-10-01&endDate=2025-10-10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o sensor-data.csv
```

**CSV Format:**
```csv
Timestamp,Temperature (°C),Humidity (%)
2025-10-10T10:30:00.000Z,28.5,65.3
2025-10-10T10:30:30.000Z,28.6,65.2
2025-10-10T10:31:00.000Z,28.5,65.4
...
```

**Export as JSON:**
```bash
curl "http://localhost:3000/api/farms/68e864c800bbe4e6f6eba577/sensor-export?format=json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**JSON Format:**
```json
{
  "success": true,
  "data": {
    "farmName": "Venujan_Farm",
    "deviceName": "SAB80SO0095",
    "period": {
      "start": "2025-10-03T...",
      "end": "2025-10-10T..."
    },
    "readings": [...],
    "total": 2880
  }
}
```

---

### **5. Clean Old Data**
```http
DELETE /api/sensor-data/cleanup
Authorization: Bearer <token>

Body:
{
  "daysToKeep": 90
}
```

**Example:**
```bash
# Delete data older than 90 days
curl -X DELETE http://localhost:3000/api/sensor-data/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"daysToKeep": 90}'
```

---

## 📈 Use Cases

### **1. Generate Daily Report**
```bash
# Get today's data
curl "http://localhost:3000/api/farms/FARM_ID/sensor-export?format=csv&startDate=$(date -I)&endDate=$(date -I)" \
  -H "Authorization: Bearer TOKEN" \
  -o daily-report-$(date -I).csv
```

### **2. Monthly Temperature Analysis**
```bash
# Get stats for last 30 days
curl "http://localhost:3000/api/farms/FARM_ID/sensor-stats?period=30d" \
  -H "Authorization: Bearer TOKEN"
```

### **3. Create Temperature Chart**
```bash
# Get hourly averages for last 7 days
curl "http://localhost:3000/api/farms/FARM_ID/sensor-chart?hours=168" \
  -H "Authorization: Bearer TOKEN"
```

---

## 🎯 Data Retention Policy

### **Default:** 90 Days
```javascript
// Automatically runs cleanup
await SensorData.cleanOldData(90); // Delete data older than 90 days
```

### **Recommended Retention Periods:**

| Use Case | Retention | Storage |
|----------|-----------|---------|
| Real-time monitoring | 7 days | ~20,000 records |
| Weekly reports | 30 days | ~86,000 records |
| Monthly analysis | 90 days | ~260,000 records |
| Yearly reports | 365 days | ~1,050,000 records |
| Permanent archive | Forever | Unlimited |

### **Storage Estimates (per farm):**
```
30-second intervals:
- 1 day = 2,880 records (~100 KB)
- 1 week = 20,160 records (~700 KB)
- 1 month = 86,400 records (~3 MB)
- 1 year = 1,051,200 records (~36 MB)
```

---

## ⚙️ Configuration

### **Adjust Save Interval**
Edit `backend/server.js`:
```javascript
// Line ~275
const SAVE_INTERVAL = 30000; // milliseconds

// Options:
// 10 seconds:  10000  (8,640 records/day)
// 30 seconds:  30000  (2,880 records/day) ← Default
// 1 minute:    60000  (1,440 records/day)
// 5 minutes:   300000 (288 records/day)
```

### **Adjust Retention Period**
```javascript
// In cleanup job or manual cleanup
await SensorData.cleanOldData(30);  // Keep 30 days
await SensorData.cleanOldData(90);  // Keep 90 days (default)
await SensorData.cleanOldData(365); // Keep 1 year
```

---

## 🔄 How It Works

### **Flow Diagram:**
```
MQTT Message arrives (every 1 second)
  ↓
Update systemState (in-memory) → Frontend sees live data
  ↓
Check: Has 30 seconds passed?
  ├─ No → Skip database save (reduce DB writes)
  └─ Yes → Save to MongoDB SensorData collection
      ↓
      {
        farmId, userId,
        temperature, humidity,
        timestamp
      }
```

### **Benefits:**
1. ✅ **Live data** - Frontend always shows current readings
2. ✅ **Historical data** - All data saved to MongoDB every 30s
3. ✅ **Reduced DB writes** - 97% fewer writes than saving every second
4. ✅ **Queryable** - Fast queries with proper indexes
5. ✅ **Exportable** - CSV/JSON export for Excel

---

## 📱 Frontend Integration

### **Display Recent Readings**
```javascript
// Fetch last 100 readings
fetch('/api/farms/FARM_ID/sensor-data?limit=100', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  const readings = data.data.readings;
  // Display in table or chart
});
```

### **Show Temperature Chart**
```javascript
// Get hourly averages for chart
fetch('/api/farms/FARM_ID/sensor-chart?hours=24', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  const chartData = data.data.map(point => ({
    time: point._id,
    temperature: point.avgTemperature,
    humidity: point.avgHumidity
  }));
  // Render chart with Chart.js or similar
});
```

### **Export Button**
```javascript
// Download CSV
const downloadCSV = () => {
  window.location.href = `/api/farms/${farmId}/sensor-export?format=csv&token=${token}`;
};
```

---

## 🚀 Next Steps

### **Immediate:**
1. ✅ Sensor data saves every 30 seconds
2. ✅ API endpoints for history/export
3. ✅ CSV export for Excel

### **Future Enhancements:**
- [ ] Scheduled email reports
- [ ] Automated Excel report generation
- [ ] Temperature alerts (too high/low)
- [ ] Machine learning trend predictions
- [ ] Multi-farm comparison charts
- [ ] Weather API integration

---

## 📊 MongoDB Compass View

After data starts saving, you'll see in Compass:

**Collections:**
- `users` - User accounts
- `farms` - Farm/device info
- `sensordatas` - ⭐ NEW! Time-series sensor data
- `schedules` - Irrigation schedules
- `irrigationhistories` - Irrigation logs

**Sample SensorData Document:**
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("68e85fd1462fe8f47c677ba3"),
  farmId: ObjectId("68e864c800bbe4e6f6eba577"),
  temperature: 28.5,
  humidity: 65.3,
  timestamp: ISODate("2025-10-10T10:30:00.000Z")
}
```

---

## ✅ Summary

Your system now:
- ✅ Saves sensor data every 30 seconds to MongoDB
- ✅ Stores complete history per farm
- ✅ Provides statistics (avg, min, max)
- ✅ Exports to CSV for Excel
- ✅ Auto-cleans old data (90-day retention)
- ✅ Supports charts with hourly averages
- ✅ Fast queries with proper indexes

**All sensor data is now permanently saved and exportable!** 🎉
