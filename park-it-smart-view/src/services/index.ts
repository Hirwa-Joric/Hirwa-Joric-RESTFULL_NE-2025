import apiClient from './apiClient';
import authService from './authService';
import parkingLotService from './parkingLotService';
import parkingRecordService from './parkingRecordService';
import reportService from './reportService';
import { testBackendConnection, getApiStatus } from './testConnection';

export {
  apiClient,
  authService,
  parkingLotService,
  parkingRecordService,
  reportService,
  testBackendConnection,
  getApiStatus
};

// Re-export types for convenience
export type { User, LoginCredentials, RegisterData, LoginResponse } from './authService';
export type { ParkingLot, CreateParkingLotData, ParkingLotResponse } from './parkingLotService';
export type {
  ParkingRecord,
  CreateEntryData,
  ExitTicket,
  ParkingRecordResponse
} from './parkingRecordService';
export type { OutgoingCarsReport, EnteredCarsReport } from './reportService'; 