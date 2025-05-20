import apiClient from './apiClient';

// Types for parking lots
export interface ParkingLot {
  id: string;
  code: string;
  name: string;
  total_spaces: number;
  available_spaces: number;
  location: string;
  fee_per_hour: number;
  created_at: string;
}

export interface CreateParkingLotData {
  code: string;
  name: string;
  total_spaces: number;
  location: string;
  fee_per_hour: number;
}

export interface ParkingLotResponse {
  parking_lots: ParkingLot[];
  total_count: number;
  page: number;
  limit: number;
}

// Parking lot services
const parkingLotService = {
  // Get all parking lots with pagination
  getAll: async (page = 1, limit = 10): Promise<ParkingLot[]> => {
    const response = await apiClient.get<{success: boolean, data: ParkingLot[], pagination: any}>('/parking-lots', {
      params: { page, limit }
    });
    // Return the array of parking lots directly instead of the wrapper object
    return response.data.data || [];
  },

  // Create a new parking lot
  create: async (data: CreateParkingLotData): Promise<ParkingLot> => {
    const response = await apiClient.post<ParkingLot>('/parking-lots', data);
    return response.data;
  },

  // Get a specific parking lot by ID
  getById: async (id: string): Promise<ParkingLot> => {
    const response = await apiClient.get<ParkingLot>(`/parking-lots/${id}`);
    return response.data;
  },
  
  // Update a parking lot
  update: async (id: string, data: Partial<CreateParkingLotData>): Promise<ParkingLot> => {
    const response = await apiClient.put<ParkingLot>(`/parking-lots/${id}`, data);
    return response.data;
  },
  
  // Delete a parking lot
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/parking-lots/${id}`);
    return response.data;
  }
};

export default parkingLotService; 