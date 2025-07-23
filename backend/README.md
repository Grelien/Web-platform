# Agricultural IoT Platform - Backend

This is the backend service for the Agricultural IoT Platform built with Node.js and Express.

## Features

- MQTT integration for IoT sensor data
- Real-time data streaming via Server-Sent Events (SSE)
- Automated irrigation scheduling
- Motor control API
- RESTful API endpoints

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Start the production server:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /api/events` - Server-Sent Events for real-time data
- `POST /api/motor/control` - Motor control
- `GET /api/schedules` - Get irrigation schedules
- `POST /api/schedules` - Create irrigation schedule
- `PUT /api/schedules/:id` - Update irrigation schedule
- `DELETE /api/schedules/:id` - Delete irrigation schedule

## Environment

The server runs on port 3000 by default.

## MQTT Configuration

Configure MQTT settings in `config/mqtt.json`.
