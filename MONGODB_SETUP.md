# MongoDB Setup Guide for Agricultural IoT Platform

Complete step-by-step guide to set up and connect MongoDB with your Agricultural IoT Platform.

## 📋 Prerequisites

- Node.js installed
- npm package manager
- MongoDB (choose local or cloud option below)

---

## 🎯 Quick Summary

Your backend **already has MongoDB configured**! You just need to:
1. Install MongoDB (local) or create MongoDB Atlas account (cloud)
2. Configure `.env` file with connection string
3. Start the backend server
4. Test user registration/login

---

## Option 1: Local MongoDB (Recommended for Development)

### Step 1: Install MongoDB

#### Windows:
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Run the `.msi` installer
3. Choose **"Complete"** installation
4. **Check** "Install MongoDB as a Service"
5. **Check** "Install MongoDB Compass" (GUI tool - optional but recommended)
6. Complete installation

#### Verify Installation:
```bash
# Open Command Prompt and run:
mongod --version
```

Expected output: `db version v7.x.x` or similar

### Step 2: Start MongoDB Service

#### Windows:
MongoDB starts automatically as a service after installation.

To verify it's running:
```bash
# Option 1: Check via services
# Press Win + R, type: services.msc
# Look for "MongoDB Server" - Status should be "Running"

# Option 2: Check via command line
net start MongoDB
```

If it's not running, start it:
```bash
net start MongoDB
```

### Step 3: Configure Environment Variables

1. Navigate to backend folder:
```bash
cd backend
```

2. Create `.env` file (if it doesn't exist):
```bash
# If .env doesn't exist, copy from example:
copy .env.example .env
```

3. Open `backend/.env` in a text editor and verify/update these settings:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration - CHANGE THIS TO A RANDOM STRING!
JWT_SECRET=change-this-to-a-very-long-random-secret-key-min-32-chars

# MongoDB Configuration - LOCAL
MONGODB_URI=mongodb://localhost:27017

# MQTT Configuration
MQTT_BROKER=mqtt://senzmate.com:1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

**⚠️ IMPORTANT**: Change `JWT_SECRET` to a unique random string (minimum 32 characters)

### Step 4: Install Dependencies

```bash
# Make sure you're in the backend folder
cd backend

# Install all dependencies
npm install
```

This installs:
- `mongoose` (MongoDB driver)
- `bcryptjs` (password hashing)
- `jsonwebtoken` (authentication)
- All other required packages

### Step 5: Start the Backend Server

```bash
# From backend folder:
npm run dev

# Or if nodemon is not installed:
npm start
```

**✅ Success! You should see:**
```
✅ MongoDB Connected: localhost
📊 Database: agri-iot-platform
Server running on http://localhost:3000
✅ Connected to MQTT broker
```

### Step 6: Verify Database Connection

#### Using MongoDB Compass (GUI):
1. Open MongoDB Compass
2. Connection string: `mongodb://localhost:27017`
3. Click "Connect"
4. You'll see `agri-iot-platform` database appear after creating your first user

#### Using MongoDB Shell:
```bash
# Open mongo shell
mongosh

# Switch to your database
use agri-iot-platform

# Show collections (will be empty until first user is created)
show collections

# Exit
exit
```

---

## Option 2: MongoDB Atlas (Cloud - Recommended for Production)

### Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Complete verification

### Step 2: Create a Free Cluster

1. Click **"Build a Database"**
2. Choose **"FREE"** tier (M0 Sandbox - 512MB)
3. Cloud Provider: Choose **AWS**, **Google Cloud**, or **Azure**
4. Region: Select closest to your location
5. Cluster Name: Leave as default or change to `agri-iot-cluster`
6. Click **"Create"** (wait 3-5 minutes for provisioning)

### Step 3: Configure Database Access (Create User)

1. In left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Authentication Method: **"Password"**
4. Username: `agriiot-admin` (or your choice)
5. Password: Click **"Autogenerate Secure Password"** and **COPY IT!** (or create your own strong password)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Configure Network Access (Whitelist IP)

1. In left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - For production: Click **"Add Current IP Address"** or enter specific IPs
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Click **"Database"** in left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **"Node.js"**, Version: **"4.1 or later"**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://agriiot-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Configure Environment Variables

1. Navigate to backend folder and open `.env`:
```bash
cd backend
notepad .env
```

2. Update MongoDB URI with your connection string:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration - CHANGE THIS!
JWT_SECRET=change-this-to-a-very-long-random-secret-key-min-32-chars

# MongoDB Configuration - ATLAS (CLOUD)
MONGODB_URI=mongodb+srv://agriiot-admin:YOUR_ACTUAL_PASSWORD@cluster0.xxxxx.mongodb.net/agri-iot-platform?retryWrites=true&w=majority

# MQTT Configuration
MQTT_BROKER=mqtt://senzmate.com:1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

**⚠️ IMPORTANT:**
- Replace `<password>` or `YOUR_ACTUAL_PASSWORD` with your actual database password
- Replace `cluster0.xxxxx.mongodb.net` with your actual cluster address
- Add `/agri-iot-platform` before the `?` to specify database name
- If password contains special characters, URL-encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - etc.

### Step 7: Install Dependencies & Start Server

```bash
# Install dependencies
npm install

# Start server
npm run dev
```

**✅ Success! You should see:**
```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
📊 Database: agri-iot-platform
Server running on http://localhost:3000
```

---

## 🧪 Testing the Connection

### Test 1: User Registration

Using **curl** (Command Prompt/PowerShell):
```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"phoneNumber\":\"1234567890\"}"
```

Using **Postman**:
- Method: `POST`
- URL: `http://localhost:3000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "1234567890"
}
```

**Expected Response:**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "1234567890",
    "isActive": true,
    "createdAt": "2025-01-09T10:30:00.000Z",
    "lastLogin": "2025-01-09T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "phoneNumber": "1234567890"
}
```

### Test 2: User Login

```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"phoneNumber\":\"1234567890\"}"
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "1234567890",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test 3: Verify in Database

**MongoDB Compass (Local):**
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Open database: `agri-iot-platform`
4. Open collection: `users`
5. You should see your user document

**MongoDB Atlas (Cloud):**
1. Go to MongoDB Atlas dashboard
2. Click **"Database"** → **"Browse Collections"**
3. Select `agri-iot-platform` database
4. Open `users` collection
5. You should see your user document

---

## 📊 Database Collections

Your application uses these MongoDB collections:

### 1. `users` Collection
```javascript
{
  _id: ObjectId("..."),
  phoneNumber: "1234567890",     // Unique, 10 digits
  firstName: "John",
  lastName: "Doe",
  email: "user1234567890@agriiot.com",  // Auto-generated
  password: "$2a$12$...",         // Hashed (bcrypt)
  role: "user",                   // or "admin"
  isActive: true,
  lastLogin: ISODate("2025-01-09T..."),
  createdAt: ISODate("2025-01-09T..."),
  updatedAt: ISODate("2025-01-09T...")
}
```

### 2. `schedules` Collection (Future - not yet migrated)
```javascript
{
  _id: ObjectId("..."),
  time: "06:00",
  action: "on",                   // or "off"
  duration: 10,                   // minutes
  frequency: "daily",             // or "weekly"
  date: "2025-01-10",            // for weekly only
  active: true,
  createdAt: ISODate("...")
}
```

### 3. `irrigationhistories` Collection (Future - not yet migrated)
```javascript
{
  _id: ObjectId("..."),
  timestamp: ISODate("..."),
  endTime: ISODate("..."),
  action: "COMPLETED",            // or "ON", "OFF"
  source: "manual",               // or "schedule"
  duration: 10,                   // minutes
  scheduleId: 123456789,
  scheduleDetails: {
    frequency: "daily",
    date: "2025-01-09",
    time: "06:00"
  }
}
```

---

## 🔧 Troubleshooting

### Problem: "Error connecting to MongoDB"

**For Local MongoDB:**
```bash
# Check if MongoDB is running
net start MongoDB

# If service doesn't exist, start manually:
mongod --dbpath="C:\data\db"

# Verify version
mongod --version
```

**For MongoDB Atlas:**
- Verify connection string is correct in `.env`
- Check that IP address is whitelisted (Network Access)
- Verify database username and password
- Test internet connection

### Problem: "MongoServerError: bad auth"

**Solution:**
- Double-check username and password in `.env`
- Ensure password doesn't have special characters (or URL-encode them)
- Verify user exists in Database Access (Atlas)
- Recreate database user if needed

### Problem: "connect ECONNREFUSED 127.0.0.1:27017"

**Solution:**
- MongoDB service is not running
- Start MongoDB: `net start MongoDB`
- Check if port 27017 is already in use: `netstat -ano | findstr :27017`

### Problem: "Phone number not found" during login

**Solution:**
1. Check backend console logs - it prints phone number being searched
2. Verify user exists in database (MongoDB Compass or Atlas)
3. Ensure phone number is exactly 10 digits, no spaces or formatting
4. Double-check you're using the same phone number from registration

### Problem: "Duplicate key error" on registration

**Solution:**
- Phone number already exists in database
- Use a different phone number
- Or login with existing number instead

---

## 🛡️ Security Best Practices

1. **✅ Never commit `.env` file** - Already in `.gitignore`
2. **✅ Use strong JWT_SECRET** - Minimum 32 random characters
3. **✅ Use strong database password** - Min 12 chars, mixed case, numbers, symbols
4. **✅ Restrict Network Access** - In production, whitelist only server IP
5. **✅ Keep dependencies updated** - Run `npm audit` regularly
6. **✅ Enable MongoDB authentication** - Always use username/password
7. **✅ Regular backups** - Set up automated backups (Atlas has this built-in)

---

## 📦 Additional Commands

### View All Environment Variables
```bash
# Windows
type backend\.env

# Or open in notepad
notepad backend\.env
```

### Check Backend Logs
```bash
# From backend folder
npm run dev

# Watch the console for:
# - "MongoDB Connected"
# - "Login attempt with phone number"
# - "User found: Yes/No"
```

### MongoDB Shell Commands
```bash
# Connect to local MongoDB
mongosh

# Show all databases
show dbs

# Use your database
use agri-iot-platform

# Show collections
show collections

# Count users
db.users.countDocuments()

# Find all users
db.users.find().pretty()

# Find specific user by phone
db.users.findOne({ phoneNumber: "1234567890" })

# Delete all users (careful!)
db.users.deleteMany({})

# Exit
exit
```

---

## ✅ Success Checklist

- [ ] MongoDB installed (local) or Atlas cluster created (cloud)
- [ ] MongoDB service running (local) or cluster active (cloud)
- [ ] `.env` file created with correct `MONGODB_URI`
- [ ] `JWT_SECRET` changed to unique random string
- [ ] Dependencies installed (`npm install`)
- [ ] Backend server starts without errors
- [ ] See "MongoDB Connected" message in console
- [ ] User registration works (test with curl/Postman)
- [ ] User login works with same phone number
- [ ] User visible in database (Compass/Atlas)

---

## 📚 Resources

- **MongoDB Documentation:** https://docs.mongodb.com/
- **Mongoose Docs:** https://mongoosejs.com/docs/
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **MongoDB Compass:** https://www.mongodb.com/products/compass
- **MongoDB University (Free Courses):** https://university.mongodb.com/

---

## 🆘 Still Need Help?

If you're still having issues:

1. Check backend console logs for detailed error messages
2. Verify `.env` file has correct values (no typos)
3. Test MongoDB connection separately: `mongosh mongodb://localhost:27017`
4. Check MongoDB Atlas Network Access (if using cloud)
5. Restart backend server after changing `.env`

**Last Updated:** January 2025

## 📊 Verify Migration

After migration, check your data:

```bash
# Open MongoDB shell
mongosh

# Switch to your database
use agri-iot-platform

# Check collections
show collections

# Count documents
db.users.countDocuments()
db.schedules.countDocuments()
db.irrigationhistories.countDocuments()

# View sample data
db.users.find().pretty()
db.schedules.find().pretty()
```

## 🗂️ Database Structure

### Users Collection
```javascript
{
  _id: ObjectId,
  phoneNumber: String (unique),
  firstName: String,
  lastName: String,
  email: String,
  role: "user" | "admin",
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Schedules Collection
```javascript
{
  _id: ObjectId,
  time: String, // "HH:MM"
  action: "on" | "off",
  duration: Number, // minutes
  frequency: "daily" | "weekly",
  date: String, // for weekly schedules
  active: Boolean,
  lastExecuted: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### IrrigationHistories Collection
```javascript
{
  _id: ObjectId,
  action: "COMPLETED" | "ON" | "OFF",
  source: "manual" | "schedule" | "device_confirm",
  duration: Number,
  scheduleDetails: {
    frequency: String,
    date: String,
    time: String
  },
  sensorData: {
    temperature: Number,
    humidity: Number
  },
  startTime: Date,
  endTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Troubleshooting

### MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
- Make sure MongoDB is running: `mongod --version`
- Check connection string in `.env`
- For local: Use `mongodb://localhost:27017/agri-iot-platform`
- For Atlas: Whitelist your IP address in Atlas dashboard

### Migration Errors

**Error:** Duplicate key error

**Solution:**
- This means data already exists in MongoDB
- The script skips existing records automatically
- To re-migrate: Drop the database first (see below)

### Drop Database (Start Fresh)

```bash
mongosh
use agri-iot-platform
db.dropDatabase()
exit
```

Then run migration again.

## 📦 NPM Scripts

Add these to `backend/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "migrate": "node scripts/migrate-to-mongodb.js"
  }
}
```

Then you can run:
```bash
npm run migrate
```

## 🎉 Next Steps

1. ✅ Install MongoDB
2. ✅ Configure `.env`
3. ✅ Run migration script
4. ⏳ Update `server.js` to use MongoDB (I'll help with this)
5. ⏳ Test the application

## 📚 Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Atlas Free Tier](https://www.mongodb.com/cloud/atlas)

---

**Need Help?** Check the troubleshooting section or ask for assistance!
