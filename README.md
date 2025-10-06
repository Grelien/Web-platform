# Grelien Agricultural IoT Platform

A modern full-stack React TypeScript application for monitoring and controlling agricultural IoT devices with real-time sensor data, automated irrigation scheduling, and secure user authentication.

## 🌟 Features

### Core Features
- **User Authentication**: Secure phone-number-based authentication system
  - Phone number registration and login
  - JWT-based session management
  - Rate limiting for security (5 attempts per 15 minutes)
  - User profile management
- **Real-time Sensor Monitoring**: Temperature and humidity tracking via MQTT
- **Motor Control**: Manual and scheduled water pump control
- **Automated Scheduling**: Daily and weekly irrigation schedules
- **Irrigation History**: Track all irrigation sessions with duration and source
- **Live Data Updates**: Server-Sent Events (SSE) for real-time updates
- **Modern UI**: Responsive glassmorphism design
- **IoT Integration**: MQTT protocol for device communication

## 🏗️ Architecture

### Frontend (React TypeScript)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 5.4
- **State Management**: React Context API (AuthContext, IoTContext)
- **Styling**: Modern CSS with glassmorphism effects
- **Icons**: Lucide React
- **Date Utilities**: date-fns
- **Location**: `frontend/` directory

### Backend (Node.js)
- **Runtime**: Node.js with Express
- **Authentication**: JWT tokens with bcrypt password hashing
- **Security**: Helmet.js, CORS, express-validator, rate limiting
- **Communication**: MQTT for IoT devices, SSE for frontend
- **Scheduling**: node-cron for automated tasks
- **Data Storage**: JSON files for users, schedules, and irrigation history
- **Location**: `backend/` directory

## 📁 Project Structure

```
Web-platform/
├── frontend/                    # Frontend application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Auth.css        # Authentication styles
│   │   │   ├── AuthContainer.tsx  # Auth page wrapper
│   │   │   ├── Login.tsx       # Login component
│   │   │   ├── Register.tsx    # Registration component
│   │   │   ├── Dashboard.tsx   # Main dashboard view
│   │   │   ├── Header.tsx      # App header with status
│   │   │   ├── SensorCard.tsx  # Temperature/humidity display
│   │   │   ├── MotorControl.tsx # Motor control interface
│   │   │   ├── IrrigationHistory.tsx # Irrigation history view
│   │   │   ├── NextSchedule.tsx # Next schedule display
│   │   │   ├── ScheduleManager.tsx # Schedule management
│   │   │   ├── NotificationProvider.tsx # Notification system
│   │   │   └── NotificationContainer.tsx # Notification UI
│   │   ├── contexts/           # React context providers
│   │   │   ├── AuthContext.tsx # Authentication state management
│   │   │   └── IoTContext.tsx  # Main IoT state management
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useAuth.ts      # Authentication hook
│   │   │   ├── useSSEConnection.ts # Server-Sent Events hook
│   │   │   └── useNotifications.ts # Notification hook
│   │   ├── types/              # TypeScript type definitions
│   │   │   └── index.ts        # All interface definitions
│   │   ├── App.tsx            # Main app component
│   │   ├── App.css            # Global styles
│   │   └── main.tsx           # App entry point
│   ├── package.json
│   └── vite.config.ts
├── backend/                    # Node.js backend
│   ├── routes/
│   │   └── auth.js            # Authentication routes
│   ├── middleware/
│   │   └── auth.js            # Auth middleware & helpers
│   ├── models/
│   │   └── User.js            # User model
│   ├── data/                  # JSON data storage
│   │   ├── users.json         # User accounts
│   │   ├── schedules.json     # Irrigation schedules
│   │   └── irrigation-history.json # Irrigation logs
│   ├── server.js              # Express server with MQTT
│   └── package.json           # Backend dependencies
├── config/
│   └── mqtt.json              # MQTT configuration
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MQTT broker** (optional, uses senzmate.com by default)

### Installation

1. **Clone the repository:**
   ```bash
   cd Web-platform
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Configuration

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration (REQUIRED for production)
JWT_SECRET=your-super-secure-random-secret-key-at-least-32-characters

# MQTT Configuration (optional, defaults are set)
MQTT_BROKER=mqtt://senzmate.com:1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

**⚠️ IMPORTANT**: The `JWT_SECRET` is **required** for production. The server will exit if it's not set in production mode.

### Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:3000`

2. **Start the frontend development server** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Access the application:**
   Open your browser and navigate to `http://localhost:5173`

### Development Commands

```bash
# Frontend
cd frontend
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend
cd backend
npm start            # Start production server
npm run dev          # Start with nodemon (auto-restart on changes)
```

## 🔐 Authentication & User Management

### Registration

1. Navigate to the registration page
2. Enter your first name and last name (Step 1)
3. Enter email, password, and **10-digit phone number** (Step 2)
4. Account is created and you're automatically logged in

### Login

1. Navigate to the login page
2. Enter your **10-digit phone number** (digits only)
3. Click "Sign In"

### Demo Credentials

For testing purposes, you can use these credentials:

**Existing Test Account:**
- Phone Number: `5587127089`
- User: Jackshan Venujan

**Or create a new account:**
- Any 10-digit phone number (e.g., `1234567890`)
- First/Last name of your choice
- Email and password (minimum 6 characters)

### Security Features

- **JWT Authentication**: 7-day token expiration
- **Rate Limiting**: Max 5 login attempts per 15 minutes per IP
- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: express-validator for all inputs
- **Helmet.js**: HTTP security headers
- **CORS**: Configured for development/production

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login with phone number
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)
- `GET /api/auth/verify` - Verify JWT token

### Real-time Data
- `GET /api/events` - Server-Sent Events stream for real-time updates

### System Status
- `GET /api/status` - Get system status
- `GET /api/sensors` - Get current sensor readings
- `GET /api/logs` - Get system logs

### Motor Control
- `POST /api/motor/control` - Control motor (on/off)
  ```json
  { "action": "on" } // or "off"
  ```

### Irrigation History
- `GET /api/irrigation-history` - Get irrigation history with pagination
  - Query params: `?limit=50&page=1`

### Schedule Management
- `GET /api/schedules` - Get all schedules
- `POST /api/schedules` - Create new schedule
  ```json
  {
    "time": "08:00",
    "action": "on",
    "duration": 30,
    "frequency": "daily",  // or "weekly"
    "date": "2025-10-15"   // required for weekly
  }
  ```
- `DELETE /api/schedules/:id` - Delete schedule

### Testing
- `POST /api/test/sensor-data` - Simulate sensor data (for testing without MQTT)
  ```json
  {
    "temperature": 25.5,
    "humidity": 60.2
  }
  ```

## 🔧 MQTT Configuration

### Topics the System Subscribes To:

- `agri/sensors/temperature` - Temperature readings (°C)
- `agri/sensors/humidity` - Humidity readings (%)
- `agri/motor/status` - Motor status updates (ON/OFF)
- `agri/device/status` - General device status (online/offline)

### Topics the System Publishes To:

- `agri/motor/control` - Motor control commands (ON/OFF)

### Default MQTT Broker

- **Broker**: `mqtt://senzmate.com:1883`
- **QoS**: 1
- **Client ID**: Auto-generated unique ID

### Testing Without MQTT

You can test the system without a real MQTT broker using the test endpoint:

```bash
curl -X POST http://localhost:3000/api/test/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"temperature": 25.5, "humidity": 60.2}'
```

## 🎨 Design Features

### Authentication UI
- **Glassmorphism Design**: Frosted glass effect with backdrop blur
- **Animated Gradient Background**: Smooth color transitions
- **Two-Step Registration**: Separated name and contact information
- **Real-time Validation**: Instant feedback on inputs
- **Phone Number Formatting**: Auto-format and validation
- **Loading States**: Visual feedback during authentication

### Dashboard UI
- **Dark Theme**: Modern dark UI with cyan/green accent colors
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live data updates without page refresh
- **Status Indicators**: Visual connection and sensor status
- **Smooth Animations**: Hover effects and transitions

## 🔒 Security & Error Handling

### Security Measures
- **JWT Secret Validation**: Prevents running in production without proper secret
- **Rate Limiting**: Protects against brute force attacks
- **Input Validation**: All user inputs are validated
- **Secure Headers**: Helmet.js for HTTP security
- **Password Hashing**: bcrypt with high salt rounds
- **Token Expiration**: 7-day JWT tokens

### Error Handling
- **Connection Monitoring**: Automatic reconnection for MQTT and SSE
- **Graceful Degradation**: UI works even when backend is offline
- **User Notifications**: Real-time error and success messages
- **Timeout Handling**: Sensor data timeout detection (15 seconds)
- **Validation Errors**: Clear error messages for user inputs

## 📊 Data Management

### User Data (`backend/data/users.json`)
```json
{
  "id": "user_1759666753928_547480e0996fc8ab",
  "phoneNumber": "5587127089",
  "firstName": "Jackshan",
  "lastName": "Venujan",
  "email": "user5587127089@agriiot.com",
  "role": "user",
  "isActive": true,
  "createdAt": "2025-10-05T12:19:13.928Z",
  "lastLogin": "2025-10-05T12:19:13.935Z"
}
```

### Irrigation History (`backend/data/irrigation-history.json`)
- Tracks all irrigation sessions
- Records start time, duration, and source (manual/schedule)
- Limited to 500 most recent events
- Auto-saves every 5 events

### Schedules (`backend/data/schedules.json`)
- Daily or weekly schedules
- Auto-disables weekly schedules after execution
- Supports duration-based auto-off

## 📱 Mobile Support

The application is fully responsive and includes:

- Mobile-optimized layouts
- Touch-friendly controls
- Adaptive phone number input
- Readable text sizes
- Optimized for screens as small as 360px wide

## 🧪 Testing

### Testing Sensor Data

```bash
# Simulate temperature and humidity
curl -X POST http://localhost:3000/api/test/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"temperature": 28.5, "humidity": 65.3}'
```

### Testing Motor Control

```bash
# Turn motor ON
curl -X POST http://localhost:3000/api/motor/control \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"action": "on"}'

# Turn motor OFF
curl -X POST http://localhost:3000/api/motor/control \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"action": "off"}'
```

## 🚀 Production Deployment

### Backend Deployment Checklist

1. Set environment variables:
   ```env
   NODE_ENV=production
   JWT_SECRET=your-super-secure-random-secret-key
   PORT=3000
   MQTT_BROKER=mqtt://your-broker:1883
   ```

2. Build and start:
   ```bash
   cd backend
   npm start
   ```

### Frontend Deployment Checklist

1. Update API URL in `frontend/src/contexts/AuthContext.tsx` and `frontend/src/hooks/useSSEConnection.ts`

2. Build for production:
   ```bash
   cd frontend
   npm run build
   ```

3. Deploy the `dist/` folder to your hosting service

## 🛠️ Troubleshooting

### Backend won't start
- **Error: JWT_SECRET not set**: Add `JWT_SECRET` to your `.env` file
- **Error: ENOENT**: Ensure `backend/data/` directory exists

### Login issues
- **Can't login with phone number**: Make sure you're using the exact phone number from registration (10 digits)
- **Rate limit exceeded**: Wait 15 minutes or restart the backend server

### Frontend can't connect
- Check that backend is running on `http://localhost:3000`
- Check browser console for CORS errors
- Verify API URLs in context files

### MQTT connection issues
- Default broker is `mqtt://senzmate.com:1883`
- Check network connectivity
- Use test endpoint to simulate data without MQTT

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the excellent framework
- MQTT.js for IoT communication
- Lucide for beautiful icons
- Vite for fast development experience
- Express.js and the Node.js community

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Create an issue in the repository

---

**Last Updated**: October 2025
**Version**: 2.0.0
