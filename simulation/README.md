# Agricultural IoT Platform - Simulation

This directory contains simulation scripts for testing the Agricultural IoT Platform.

## MQTT Simulator

The `mqtt_simulator.py` script simulates IoT sensor data by publishing MQTT messages.

### Prerequisites

- Python 3.x
- paho-mqtt library

### Installation

```bash
pip install paho-mqtt
```

Or use npm to run the install script:
```bash
npm run install
```

### Usage

Run the MQTT simulator:
```bash
python mqtt_simulator.py
```

Or use npm:
```bash
npm run mqtt-sim
```

### Configuration

The simulator publishes to the following MQTT topics:
- `sensors/temperature` - Temperature readings
- `sensors/humidity` - Humidity readings
- `motor/status` - Motor status updates

Make sure your MQTT broker is running and the backend is configured to connect to the same broker.
