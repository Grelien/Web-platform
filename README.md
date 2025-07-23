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
- **Framework**: React 19 with TypeScript
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
├── frontend/              # React TypeScript application
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── node_modules/      # Frontend dependencies
│   ├── performance-scripts.json # Performance analysis scripts
│   └── package.json       # Frontend configuration
├── backend/               # Node.js Express server
│   ├── data/              # JSON data storage
│   ├── config/            # Configuration files
│   ├── node_modules/      # Backend dependencies
│   ├── server.js          # Main server file
│   └── package.json       # Backend configuration
├── simulation/            # MQTT simulation scripts
│   ├── mqtt_simulator.py  # MQTT testing simulator
│   ├── package.json       # Simulation scripts
│   └── README.md          # Simulation documentation
├── docs/                  # Project documentation
│   ├── IRRIGATION_HISTORY_FIX.md # Irrigation logging optimization
│   ├── OPTIMIZATION_SUMMARY.md   # Performance optimizations
│   └── README.md          # Documentation index
├── .github/               # GitHub configuration
├── .vscode/               # VS Code configuration
└── package.json           # Root workspace configuration
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
   cd eranga2
   ```

2. **Install frontend and backend dependencies separately:**
   ```bash
   npm run install:all
   ```

3. **Start both frontend and backend in development mode:**
   ```bash
   npm run dev
   ```
   This will open two separate terminal windows:
   - Backend runs on `http://localhost:3000`
   - Frontend runs on `http://localhost:5173`

### Alternative Startup Methods

1. **PowerShell approach** (with better terminal management):
   ```bash
   npm run dev:ps
   ```

2. **Manual separate terminals**:
   ```bash
   # Terminal 1:
   npm run dev:backend
   
   # Terminal 2:
   npm run dev:frontend
   ```

### Development Commands

```bash
# Root workspace (no dependencies needed)
npm run install:all      # Install frontend and backend dependencies
npm run install:frontend # Install only frontend dependencies
npm run install:backend  # Install only backend dependencies
npm run dev              # Start both in separate terminal windows
npm run dev:ps           # Start both using PowerShell (cleaner)
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend
npm run build            # Build frontend for production
npm run start            # Start backend in production mode
npm run clean            # Clean all node_modules
npm run sim:mqtt         # Run MQTT simulator

# Frontend only (in frontend/ directory)
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Backend only (in backend/ directory)
npm start                # Start production server
npm run dev              # Start with nodemon (auto-restart)

# Simulation (in simulation/ directory)
npm run mqtt-sim         # Run MQTT simulator
npm run install          # Install Python dependencies
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
