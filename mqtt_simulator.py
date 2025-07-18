import paho.mqtt.client as mqtt
import json
import time
import random
import threading
from datetime import datetime

# MQTT Configuration
MQTT_BROKER = "senzmate.com"
MQTT_PORT = 1883
CLIENT_ID = "agri_device_001"

# MQTT Topics
TEMPERATURE_TOPIC = "agri/sensors/temperature"
HUMIDITY_TOPIC = "agri/sensors/humidity"
MOTOR_CONTROL_TOPIC = "agri/motor/control"
MOTOR_STATUS_TOPIC = "agri/motor/status"
DEVICE_STATUS_TOPIC = "agri/device/status"

class IoTDevice:
    def __init__(self):
        self.client = mqtt.Client(client_id=CLIENT_ID)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        
        # Device configuration
        self.device_name = "Smart Farm Device #1"
        self.device_location = "Farm Sector A"
        
        # Sensor state
        self.temperature = 25.0
        self.humidity = 60.0
        self.motor_state = False
        self.running = True
        
        # Data publishing intervals (seconds)
        self.sensor_interval = 3

    def connect_to_broker(self):
        """Connect to MQTT broker"""
        try:
            print(f"🔗 Connecting to MQTT broker: {MQTT_BROKER}:{MQTT_PORT}")
            self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MQTT broker: {e}")
            return False

    def on_connect(self, client, userdata, flags, rc):
        """Callback for when client connects to broker"""
        if rc == 0:
            print(f"✅ Connected to MQTT broker successfully!")
            print(f"🏷️  Client ID: {CLIENT_ID}")
            print(f"📍 Location: {self.device_location}")
            
            # Subscribe to motor control topic
            client.subscribe(MOTOR_CONTROL_TOPIC)
            print(f"🔔 Subscribed to: {MOTOR_CONTROL_TOPIC}")
            
            # Publish device online status with retain
            device_status = {
                "status": "online",
                "timestamp": datetime.now().isoformat(),
                "device_id": CLIENT_ID,
                "device_name": self.device_name,
                "location": self.device_location
            }
            client.publish(DEVICE_STATUS_TOPIC, json.dumps(device_status), retain=True)
            print("📡 Published device online status")
            
        else:
            print(f"❌ Failed to connect to MQTT broker. Return code: {rc}")

    def simulate_sensors(self):
        """Simulate sensor data generation"""
        while self.running:
            try:
                # Generate realistic sensor data
                self.temperature += random.uniform(-1, 1)
                self.temperature = max(15, min(40, self.temperature))  # Keep in realistic range
                
                self.humidity += random.uniform(-2, 2)
                self.humidity = max(20, min(90, self.humidity))  # Keep in realistic range
                
                # Publish sensor data with retain flag
                self.client.publish(TEMPERATURE_TOPIC, str(round(self.temperature, 1)), retain=True)
                self.client.publish(HUMIDITY_TOPIC, str(round(self.humidity, 1)), retain=True)
                
                print(f"🌡️  Temp: {self.temperature:.1f}°C | 💧 Humidity: {self.humidity:.1f}%")
                
                time.sleep(self.sensor_interval)
                
            except Exception as e:
                print(f"❌ Error in sensor simulation: {e}")
                break

    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages"""
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')
            
            print(f"📨 Received message on {topic}: {payload}")
            
            if topic == MOTOR_CONTROL_TOPIC:
                self.handle_motor_control(payload)
                
        except Exception as e:
            print(f"❌ Error processing message: {e}")

    def handle_motor_control(self, command):
        """Handle motor control commands"""
        try:
            if command.upper() == "ON":
                self.motor_state = True
                status = "ON"
                print("🔄 Motor turned ON")
            elif command.upper() == "OFF":
                self.motor_state = False
                status = "OFF"
                print("⏹️  Motor turned OFF")
            else:
                print(f"❓ Unknown motor command: {command}")
                return
            
            # Publish motor status confirmation with retain
            motor_status = {
                "status": status,
                "timestamp": datetime.now().isoformat(),
                "device_id": CLIENT_ID
            }
            
            self.client.publish(MOTOR_STATUS_TOPIC, json.dumps(motor_status), retain=True)
            print(f"✅ Motor status published: {status}")
            
        except Exception as e:
            print(f"❌ Error handling motor control: {e}")

    def on_disconnect(self, client, userdata, rc):
        """Handle disconnection from broker"""
        if rc != 0:
            print(f"🔌 Unexpected disconnection from MQTT broker. Code: {rc}")
        else:
            print("👋 Disconnected from MQTT broker")

    def stop(self):
        """Stop the device simulation"""
        print("🛑 Stopping device simulation...")
        self.running = False
        
        # Publish device offline status with retain before disconnecting
        device_status = {
            "status": "offline",
            "timestamp": datetime.now().isoformat(),
            "device_id": CLIENT_ID,
            "device_name": self.device_name,
            "location": self.device_location
        }
        self.client.publish(DEVICE_STATUS_TOPIC, json.dumps(device_status), retain=True)
        print("📡 Published device offline status")
        
        # Give time for the message to be sent
        time.sleep(0.5)
        
        # Disconnect from broker
        self.client.disconnect()

    def run(self):
        """Start the device simulation"""
        print("🚀 Starting IoT Device Simulator...")
        print("=" * 50)
        
        if not self.connect_to_broker():
            return
        
        # Start background thread
        sensor_thread = threading.Thread(target=self.simulate_sensors, daemon=True)
        
        # Start MQTT loop in background
        self.client.loop_start()
        
        # Start thread
        sensor_thread.start()
        
        try:
            print("📊 Device simulation running... Press Ctrl+C to stop")
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Received stop signal...")
        finally:
            self.stop()

def main():
    """Main function to run the IoT device simulator"""
    device = IoTDevice()
    device.run()

if __name__ == "__main__":
    main()