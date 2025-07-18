# Copilot Instructions for Agricultural IoT Platform

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a React TypeScript agricultural IoT monitoring platform that integrates with a Node.js backend for real-time sensor data monitoring and automated irrigation control.

## Architecture Guidelines
- Use React functional components with TypeScript
- Implement proper state management with React hooks (useState, useEffect, useContext)
- Follow component composition patterns for modularity
- Use Server-Sent Events (SSE) for real-time data updates
- Implement responsive design with modern CSS-in-JS or CSS modules
- Follow TypeScript best practices with proper typing

## Component Structure
- Keep components small and focused on single responsibilities
- Use custom hooks for business logic and state management
- Implement proper error boundaries and loading states
- Use proper TypeScript interfaces for props and state

## Backend Integration
- The backend is a Node.js Express server with MQTT integration
- Real-time data comes through Server-Sent Events (SSE) at `/api/events`
- Motor control uses POST requests to `/api/motor/control`
- Schedule management uses RESTful endpoints at `/api/schedules`

## Styling Guidelines
- Use modern CSS with CSS Grid and Flexbox
- Implement dark theme with glassmorphism effects
- Ensure responsive design for mobile and desktop
- Use CSS custom properties for theming

## Code Quality
- Use ESLint and TypeScript for code quality
- Implement proper error handling
- Add loading states for async operations
- Use semantic HTML and accessibility best practices
