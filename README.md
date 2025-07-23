# Grelien Agricultural IoT Platform

A modern React TypeScript application for monitoring and controlling agricultural IoT devices with real-time sensor data and automated irrigation scheduling.

## 🌟 Features

- **Real-time Sensor Monitoring**: Temperature and humidity tracking via MQTT
- **Motor Control**: Manual and scheduled water pump control
- **Automated Scheduling**: Daily and one-time irrigation schedules
- **Live Data Updates**: Server-Sent Events (SSE) for real-time updates
- **Modern UI**: Responsive design with glassmorphism effects
- **IoT Integration**: MQTT protocol for device communication

## 🏗️ Architecture

### Frontend (React TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: React Context API with useReducer
- **Styling**: Modern CSS with CSS Grid and Flexbox
- **Icons**: Lucide React
- **Date Utilities**: date-fns

### Backend (Node.js)
- **Runtime**: Node.js with Express
- **Communication**: MQTT for IoT devices, SSE for frontend
- **Scheduling**: node-cron for automated tasks
- **Data Storage**: JSON files for schedules and logs

## 📁 Project Structure

```
├── src/
│   ├── components/         # React components
│   │   ├── Dashboard.tsx   # Main dashboard view
│   │   ├── Header.tsx      # App header with status
│   │   ├── SensorCard.tsx  # Temperature/humidity display
│   │   ├── MotorControl.tsx # Motor control interface
│   │   ├── NextSchedule.tsx # Next schedule display
│   │   ├── ScheduleManager.tsx # Schedule management
│   │   ├── NotificationProvider.tsx # Notification system
│   │   └── NotificationContainer.tsx # Notification UI
│   ├── contexts/          # React context providers
│   │   └── IoTContext.tsx # Main IoT state management
│   ├── hooks/             # Custom React hooks
│   │   ├── useSSEConnection.ts # Server-Sent Events hook
│   │   └── useNotifications.ts # Notification hook
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # All interface definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx           # Main app component
│   ├── App.css           # Global styles
│   └── main.tsx          # App entry point
├── backend/               # Node.js backend
│   ├── server.js         # Express server with MQTT
│   ├── package.json      # Backend dependencies
│   └── data/             # JSON data storage
├── public/
│   └── assets/           # Static assets
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MQTT broker (optional, can use public broker for testing)

### Installation

1. **Clone and setup the project:**
   ```bash
   cd eranga
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:3000`

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Development Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend
cd backend
npm start            # Start production server
npm run dev          # Start with nodemon (auto-restart)
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
```

### MQTT Topics

The system subscribes to these MQTT topics:

- `agri/sensors/temperature` - Temperature readings (°C)
- `agri/sensors/humidity` - Humidity readings (%)
- `agri/motor/status` - Motor status updates
- `agri/device/status` - General device status

And publishes to:

- `agri/motor/control` - Motor control commands (ON/OFF)
- `agri/motor/emergency` - Emergency stop commands

## 🌐 API Endpoints

### Real-time Data
- `GET /api/events` - Server-Sent Events stream for real-time updates

### System Status
- `GET /api/status` - Get system status
- `GET /api/sensors` - Get current sensor readings
- `GET /api/logs` - Get system logs

### Motor Control
- `POST /api/motor/control` - Control motor (on/off)
- `POST /api/motor/emergency-stop` - Emergency motor stop

### Schedule Management
- `GET /api/schedules` - Get all schedules
- `POST /api/schedules` - Create new schedule
- `DELETE /api/schedules/:id` - Delete schedule

### Testing
- `POST /api/test/sensor-data` - Simulate sensor data (for testing)

## 🎨 Design Features

- **Dark Theme**: Modern dark UI with cyan/green accent colors
- **Glassmorphism**: Frosted glass effect with backdrop blur
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live data updates without page refresh
- **Status Indicators**: Visual connection and sensor status
- **Smooth Animations**: Hover effects and transitions

## 🔒 Error Handling

- **Connection Monitoring**: Automatic reconnection for MQTT and SSE
- **Graceful Degradation**: UI works even when backend is offline
- **User Notifications**: Real-time error and success messages
- **Timeout Handling**: Sensor data timeout detection

## 🧪 Testing

### Testing Sensor Data

You can simulate sensor data without a real MQTT broker:

```bash
curl -X POST http://localhost:3000/api/test/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"temperature": 25.5, "humidity": 60.2}'
```

## 📱 Mobile Support

The application is fully responsive and includes:

- Mobile-optimized layouts
- Touch-friendly controls
- Collapsible navigation
- Readable text sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the excellent framework
- MQTT.js for IoT communication
- Lucide for beautiful icons
- Vite for fast development experience
