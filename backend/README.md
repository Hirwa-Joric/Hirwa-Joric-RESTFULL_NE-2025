# XWZ LTD Car Parking Management System - Backend

This is the backend API for the XWZ LTD Car Parking Management System. It provides endpoints for user management, parking lot management, car entry/exit tracking, and reporting.

## Technologies Used

- Node.js & Express.js
- PostgreSQL
- JWT Authentication
- Swagger API Documentation

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Setup Instructions

### Database Setup

1. Install PostgreSQL and create a database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE xwz_parking_db;

# Connect to the created database
\c xwz_parking_db

# Exit PostgreSQL
\q
```

2. Run the database setup script:

```bash
# Using npm script
npm run db:setup

# Or manually with psql
psql -U postgres -f src/config/database.sql
```

### Application Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-folder>/backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:
   
   Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/xwz_parking_db
JWT_SECRET=xwz-parking-jwt-secret-for-token-generation
JWT_EXPIRES_IN=3h
```

4. Start the server:

```bash
# For development with auto-reload
npm run dev

# For production
npm start
```

## API Documentation

Once the server is running, you can access the API documentation at:

```
http://localhost:5000/api-docs
```

## API Endpoints

### User Management

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get JWT token
- `GET /api/users/profile` - Get current user profile

### Parking Lot Management

- `POST /api/parking-lots` - Create a new parking lot (Admin only)
- `GET /api/parking-lots` - List all parking lots
- `GET /api/parking-lots/:id` - Get single parking lot details
- `PUT /api/parking-lots/:id` - Update a parking lot (Admin only)
- `DELETE /api/parking-lots/:id` - Delete a parking lot (Admin only)

### Parking Record Management

- `POST /api/parking-records/entry` - Register car entry
- `PUT /api/parking-records/exit/:id` - Record car exit and generate bill
- `GET /api/parking-records` - List all parking records (Admin only)
- `GET /api/parking-records/:id` - Get single parking record details

### Reports

- `GET /api/reports/outgoing-cars` - Report of outgoing cars (Admin only)
- `GET /api/reports/entered-cars` - Report of entered cars (Admin only)

## Default Admin User

The system is pre-configured with a default admin user:

- Email: admin@xwz.com
- Password: admin123

## Error Handling

The API follows a standardized error response format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Validation errors if any
}
```

## Authentication

All protected routes require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
``` 