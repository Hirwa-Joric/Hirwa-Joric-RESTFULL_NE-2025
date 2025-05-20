import apiClient from './apiClient';

// Types for parking records
export interface ParkingRecord {
  id: string;
  car_plate_number: string;
  parking_lot_id: string;
  parking_lot_name?: string;
  parking_lot_code?: string;
  entry_time: string;
  exit_time: string | null;
  charged_amount: number;
  created_at: string;
  fee_per_hour?: number;
}

export interface CreateEntryData {
  car_plate_number: string;
  parking_lot_id: string;
}

export interface ExitTicket {
  id: string;
  car_plate_number: string;
  entry_time: string;
  exit_time: string;
  durationHours: number;
  fee: number;
  parking_lot_name: string;
}

export interface ParkingRecordResponse {
  records: ParkingRecord[];
  total_count: number;
  page: number;
  limit: number;
}

// Parking record services
const parkingRecordService = {
  // Register car entry
  createEntry: async (data: CreateEntryData): Promise<{success: boolean, data: {ticket: ParkingRecord, parkingLot: any}}> => {
    const response = await apiClient.post<{success: boolean, data: {ticket: ParkingRecord, parkingLot: any}}>('/parking-records/entry', data);
    return response.data;
  },

  // Record car exit and generate bill
  recordExit: async (recordId: string): Promise<{success: boolean, data: {bill: any, parkingLot: any}}> => {
    const response = await apiClient.put<{success: boolean, data: {bill: any, parkingLot: any}}>(`/parking-records/exit/${recordId}`);
    return response.data;
  },

  // Find active parking record by plate number
  findByPlate: async (plateNumber: string): Promise<{success: boolean, data: ParkingRecord}> => {
    const response = await apiClient.get<{success: boolean, data: ParkingRecord}>(`/parking-records/plate/${plateNumber}`);
    return response.data;
  },
  
  // Get all active parking records
  getActive: async (page = 1, limit = 10): Promise<ParkingRecordResponse> => {
    const response = await apiClient.get<ParkingRecordResponse>('/parking-records/active', {
      params: { page, limit }
    });
    return response.data;
  },
  
  // Get a specific parking record by ID
  getById: async (id: string): Promise<ParkingRecord> => {
    const response = await apiClient.get<ParkingRecord>(`/parking-records/${id}`);
    return response.data;
  }
};

export default parkingRecordService; 