# XWZ Car Parking Management System

## Overview
This is a car parking management system for XWZ LTD, responsible for managing and charging parking in Kigali city and other areas in Rwanda. The system provides security for automobiles and collects parking fees for both local government and private entities.

## Architecture
The system is built using a microservices-inspired architecture:

- **Frontend**: React.js SPA using TypeScript
- `backend/` - Node.js/Express API server
- `park-it-smart-view/` - React/TypeScript frontend
- `postgres_data/` - Persistent data storage for PostgreSQL

## Features
- User authentication and role-based access control (Admin and Parking Attendant)
- Parking lot management and monitoring
- Car entry and exit tracking
- Fee calculation based on parking duration
- Reporting for outgoing cars with total charges
- Realtime display of parking availability

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn
- PostgreSQL

### Database Setup
1. Make sure PostgreSQL is installed and running
2. Setup the database using the provided script:
   ```
   cd backend
   npm run db:setup
   ```
   This will:
   - Create the database (xwz_parking_db)
   - Create all required tables (Users, ParkingLots, ParkingRecords)
   - Create necessary indexes
   - Insert a default admin user (email: admin@xwz.com, password: admin123)

   Note: You may need to adjust the PostgreSQL user in the script or provide a password if your PostgreSQL setup requires it.

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following contents:
   ```
   PORT=5000
   DATABASE_URL=postgresql://username:password@localhost:5432/xwz_parking
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the backend:
   ```
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd park-it-smart-view
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the frontend:
   ```
   npm run dev
   ```

### Quick Start
To start both the backend and frontend servers simultaneously:
1. Make the start script executable:
   ```
   chmod +x start-servers.sh
   ```
2. Run the start script:
   ```
   ./start-servers.sh
   ```

This will start both the backend server on port 5000 and the frontend development server (typically on port 5173 or 3000). The script will trap Ctrl+C so you can stop both servers at once.

## API Documentation
The API documentation is available at:
```
http://localhost:5000/api-docs
```

## Default Ports
- Backend: http://localhost:5000
- Frontend: http://localhost:5173 (or the port shown in the terminal)

## Usage Guide
1. Register as either an Admin or Parking Attendant
2. Admin can:
   - Manage parking lots
   - View reports
   - View all users
3. Parking Attendant can:
   - Register car entry
   - Process car exit
   - Calculate fees
   - View available parking spaces

## Common Issues and Troubleshooting

### Backend API route issues
The backend uses the `/api` prefix for all routes. Make sure that your frontend API calls include this prefix. Check the `apiClient.ts` file to ensure it has:
```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

### Field name mismatches between frontend and backend
The backend and frontend may use different naming conventions for fields. In particular:
- Backend: snake_case (e.g., `fee_per_hour`, `total_spaces`)
- Frontend: camelCase (e.g., `hourlyRate`, `capacity`)

The API services should handle these mappings, but if you encounter issues, check the mapping logic in services.

### Authentication issues
- Make sure your JWT token is being stored correctly in localStorage
- The backend expects roles in lowercase (`admin`, `parking_attendant`), while the frontend uses capitalized roles (`Admin`, `Attendant`)
- The JWT token should be included in the Authorization header as `Bearer <token>`

### Database connection issues
- Verify your PostgreSQL service is running
- Check the connection string in the `.env` file
- Make sure the database `xwz_parking` exists

### Server startup issues
If the start-servers.sh script fails, try:
1. Running the backend and frontend separately in different terminals
2. Checking for port conflicts (other services running on ports 5000 or 5173)
3. Making sure all dependencies are installed correctly

## Development Notes

- The backend follows a modular architecture with controllers, routes, models, and middlewares
- The frontend is built with React, TypeScript, and modern React patterns
- Authentication is handled with JWT tokens
- All API responses are paginated for better performance

## License

This project is licensed under the ISC License. # RESTFULL_NE-2025
# Hirwa-Joric-RESTFULL_NE-2025
# Hirwa-Joric-RESTFULL_NE-2025
