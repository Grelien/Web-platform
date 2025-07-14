# 🌱 Grelien Web Platform

This is the **IoT platform frontend and backend** for the Grelien Agricultural Automation System. It enables real-time **motor control**, **schedule management**, and **sensor data monitoring** (humidity & temperature) through MQTT-based communication with embedded devices.

---

## 📌 Features

- 🌐 Web Dashboard for farmers/agro users
- ⚙️ Manual motor control (ON/OFF)
- 📆 Scheduled motor control
- 🌡️ Real-time display of humidity & temperature
- 🛰️ MQTT-based device communication
- 🗃️ REST API for schedule and control
- 🔒 Optional: User authentication and multi-device support

---

## 🧱 Tech Stack

### Backend
- Node.js (Express / NestJS)
- MQTT.js (client communication)
- MongoDB / Firebase (schedule and log storage)
- node-cron (for scheduled control)

### Frontend
- React.js
- mqtt.js (WebSocket MQTT client)
- Axios (for REST API communication)
- Tailwind CSS / Material UI

---

## 📂 Project Structure

Web-platform/
├── backend/
│ ├── mqtt/ # MQTT client logic
│ ├── routes/ # API endpoints
│ ├── models/ # DB models (schedules, logs)
│ └── app.js # Main backend entry point
├── frontend/
│ ├── src/
│ │ ├── components/ # UI components
│ │ ├── pages/ # Pages (Dashboard, Scheduler)
│ │ └── mqttClient.js # MQTT WebSocket logic
└── README.md


---

## 🚀 Getting Started

### Prerequisites
- Node.js
- MongoDB or Firebase (optional)
- MQTT broker (e.g., [Mosquitto](https://mosquitto.org/), [HiveMQ](https://www.hivemq.com/), or [CloudMQTT](https://www.cloudmqtt.com/))

### Clone the repository

```
git clone https://github.com/Grelien/Web-platform.git
cd Web-platform
```
1. Start the Backend
```
cd backend
npm install
npm start
```
2. Start the Frontend
```
cd ../frontend
npm install
npm start
```
🧪 Development Notes

    The MQTT broker URL and credentials are configured in mqttClient.js (both backend and frontend).

    Sensor data topics should follow the structure:
    grelen/agro/sensor/temp
```
grelen/agro/sensor/humidity
grelen/agro/motor/control
grelen/agro/motor/schedule
```
## 🤝 Contributing

We welcome contributions from the community!
Please fork the repository and submit a Pull Request.

## 📜 License

All projects under Grelien are open-source and licensed under the [MIT License](https://opensource.org/licenses/MIT) unless otherwise stated.

> Built with 💚 for the farmers of tomorrow.
