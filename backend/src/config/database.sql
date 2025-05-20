-- Create database
CREATE DATABASE xwz_parking_db;

-- Connect to the database
\c xwz_parking_db;

-- Create Users table
CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'parking_attendant')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ParkingLots table
CREATE TABLE ParkingLots (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  total_spaces INTEGER NOT NULL,
  available_spaces INTEGER NOT NULL,
  location TEXT,
  fee_per_hour DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ParkingRecords table
CREATE TABLE ParkingRecords (
  id SERIAL PRIMARY KEY,
  car_plate_number VARCHAR(20) NOT NULL,
  parking_lot_id INTEGER NOT NULL REFERENCES ParkingLots(id),
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  exit_time TIMESTAMP NULL,
  charged_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on car_plate_number for faster searches
CREATE INDEX idx_parking_records_car_plate ON ParkingRecords(car_plate_number);

-- Create indexes for reporting queries
CREATE INDEX idx_parking_records_entry_time ON ParkingRecords(entry_time);
CREATE INDEX idx_parking_records_exit_time ON ParkingRecords(exit_time);

-- Create a default admin user (password is 'admin123')
INSERT INTO Users (firstName, lastName, email, password_hash, role)
VALUES ('Admin', 'User', 'admin@xwz.com', '$2a$10$X4yL/F.zhBeHgKcCQ9LQVeXyJh4zRUn6/6CrH0A.YQl4P3EuhVvEy', 'admin'); 