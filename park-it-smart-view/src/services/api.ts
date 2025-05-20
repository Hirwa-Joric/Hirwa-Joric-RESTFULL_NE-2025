import apiClient from './apiClient';
import { toast } from "sonner";
import logger from '../utils/logger';

// Type definitions for API responses
export interface ParkingLot {
  id: string;
  name: string;
  location: string;
  capacity: number;
  availableSpaces: number;
  hourlyRate: number;
}

export interface ParkingRecord {
  id: string;
  parkingLotId: string;
  vehiclePlate: string;
  entryTime: string;
  exitTime: string | null;
  fee: number | null;
  status: 'active' | 'completed';
}

export interface ExitTicket {
  id: string;
  vehiclePlate: string;
  entryTime: string;
  exitTime: string;
  duration: string;
  fee: number;
  parkingLotName: string;
}

export interface ReportResponse {
  records: ParkingRecord[];
  totalAmount?: number;
}

export interface DashboardSummary {
  todaySummary: {
    checkIns: number;
    checkOuts: number;
  };
  recentActivity: {
    id: number;
    plateNumber: string;
    activity: string;
    time: string;
  }[];
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

// Mock users for testing
const MOCK_USERS = [
  {
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'Admin'
  },
  {
    id: '2',
    firstName: 'Parking',
    lastName: 'Attendant',
    email: 'attendant@test.com',
    password: 'attendant123',
    role: 'Attendant'
  }
];

// Mock data for parking lots
const MOCK_PARKING_LOTS: ParkingLot[] = [
  {
    id: '1',
    name: 'Downtown Parking',
    location: '123 Main Street',
    capacity: 100,
    availableSpaces: 45,
    hourlyRate: 5
  },
  {
    id: '2',
    name: 'Airport Parking',
    location: '789 Airport Road',
    capacity: 200,
    availableSpaces: 120,
    hourlyRate: 8
  },
  {
    id: '3',
    name: 'Shopping Mall Parking',
    location: '456 Market Avenue',
    capacity: 150,
    availableSpaces: 30,
    hourlyRate: 3
  }
];

// Mock data for parking records
const MOCK_PARKING_RECORDS: ParkingRecord[] = [
  {
    id: '1',
    parkingLotId: '1',
    vehiclePlate: 'ABC123',
    entryTime: new Date(Date.now() - 3600000).toISOString(),
    exitTime: new Date().toISOString(),
    fee: 5,
    status: 'completed'
  },
  {
    id: '2',
    parkingLotId: '2',
    vehiclePlate: 'XYZ789',
    entryTime: new Date(Date.now() - 7200000).toISOString(),
    exitTime: new Date().toISOString(),
    fee: 16,
    status: 'completed'
  },
  {
    id: '3',
    parkingLotId: '1',
    vehiclePlate: 'DEF456',
    entryTime: new Date().toISOString(),
    exitTime: null,
    fee: null,
    status: 'active'
  }
];

// Mock API service that returns promises similar to axios responses
const mockApiResponse = <T>(data: T, delay = 500): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

// Authentication service
export const authService = {
  login: async (email: string, password: string) => {
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid credentials");
    }
    const { password: _, ...userWithoutPassword } = user;
    return await mockApiResponse(userWithoutPassword);
  },
  
  register: async (userData: any) => {
    return await mockApiResponse({ success: true, message: 'User registered successfully' });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Real API services with fallback to mock data
// Parking lots service
export const parkingLotsService = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<{ data: ParkingLot[]; pagination?: { total: number; totalPages: number; currentPage: number; } }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `/parking-lots${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      // Debug the API response data to see what we're actually getting
      console.log('Parking lots API response:', response.data);
      logger.debug('Parking lots data structure:', JSON.stringify(response.data, null, 2));
      
      // Map backend response to frontend format
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const mappedLots = response.data.data.map((lot: any) => {
          // Debug each lot to see what fields are available
          console.log('Mapping lot:', lot);
          
          // Parse numerical values to ensure they're numbers
          const totalSpaces = parseInt(lot.total_spaces) || 0;
          const availableSpaces = parseInt(lot.available_spaces) || 0;
          const feePerHour = parseFloat(lot.fee_per_hour) || 0;
          
          // Calculate occupied spaces
          const occupiedSpaces = Math.max(0, totalSpaces - availableSpaces);
          
          // Build the lot object with proper field mapping
          const mappedLot = {
            id: lot.id || '',
            name: lot.name || 'Unknown',
            location: lot.location || '',
            capacity: totalSpaces,
            availableSpaces: availableSpaces,
            hourlyRate: feePerHour
          };
          
          console.log('Mapped lot:', mappedLot);
          return mappedLot;
        });
        
        // Return data with pagination information if available
        if (response.data.pagination) {
          return {
            data: mappedLots,
            pagination: {
              total: response.data.pagination.total || mappedLots.length,
              totalPages: response.data.pagination.totalPages || Math.ceil(mappedLots.length / (params?.limit || 10)),
              currentPage: response.data.pagination.currentPage || (params?.page || 1)
            }
          };
        }
        
        return {
          data: mappedLots,
          pagination: {
            total: mappedLots.length,
            totalPages: Math.ceil(mappedLots.length / (params?.limit || 10)),
            currentPage: params?.page || 1
          }
        };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error fetching parking lots:', error);
      toast.error('Failed to fetch parking lots');
      
      // Fallback to mock data if API call fails
      // Implement pagination for mock data
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedLots = MOCK_PARKING_LOTS.slice(startIndex, endIndex);
      
      return {
        data: paginatedLots,
        pagination: {
          total: MOCK_PARKING_LOTS.length,
          totalPages: Math.ceil(MOCK_PARKING_LOTS.length / limit),
          currentPage: page
        }
      };
    }
  },
  
  create: async (parkingLotData: any): Promise<ParkingLot> => {
    try {
      // We're already sending backend-compatible field names from the form
      // so no need to transform here
      logger.debug('Creating parking lot with data:', parkingLotData);
      
      const response = await apiClient.post('/parking-lots', parkingLotData);
      
      // Map response to frontend format
      const backendLot = response.data.data;
      return {
        id: backendLot.id,
        name: backendLot.name,
        location: backendLot.location,
        capacity: backendLot.total_spaces,
        availableSpaces: backendLot.available_spaces,
        hourlyRate: backendLot.fee_per_hour
      };
    } catch (error) {
      console.error('Error creating parking lot:', error);
      toast.error('Failed to create parking lot');
      
      // Fallback to mock implementation
      const newParkingLot: ParkingLot = {
        id: String(MOCK_PARKING_LOTS.length + 1),
        name: parkingLotData.name,
        location: parkingLotData.location,
        capacity: parkingLotData.total_spaces || 0,
        availableSpaces: parkingLotData.total_spaces || 0,
        hourlyRate: parkingLotData.fee_per_hour || 0
      };
      
      MOCK_PARKING_LOTS.push(newParkingLot);
      return newParkingLot;
    }
  },
  
  getById: async (id: string): Promise<ParkingLot> => {
    try {
      const response = await apiClient.get(`/parking-lots/${id}`);
      
      // Map backend response to frontend format
      const lot = response.data.data;
      return {
        id: lot.id,
        name: lot.name,
        location: lot.location,
        capacity: lot.total_spaces,
        availableSpaces: lot.available_spaces,
        hourlyRate: lot.fee_per_hour
      };
    } catch (error) {
      console.error(`Error fetching parking lot ${id}:`, error);
      toast.error('Failed to fetch parking lot details');
      
      // Fallback to mock implementation
      const parkingLot = MOCK_PARKING_LOTS.find(lot => lot.id === id);
      if (!parkingLot) {
        throw new Error('Parking lot not found');
      }
      return parkingLot;
    }
  }
};

// Parking records service
export const parkingRecordsService = {
  createEntry: async (entryData: {car_plate_number: string, parking_lot_id: string}): Promise<{success: boolean, data: {ticket: any, parkingLot: any}}> => {
    try {
      logger.debug('Sending parking entry data to backend:', entryData);
      const response = await apiClient.post('/parking-records/entry', entryData);
      return response.data;
    } catch (error) {
      console.error('Error creating parking entry:', error);
      toast.error('Failed to register vehicle entry');
      
      // Fallback to mock implementation
      const newRecord: ParkingRecord = {
        id: String(MOCK_PARKING_RECORDS.length + 1),
        parkingLotId: entryData.parking_lot_id,
        vehiclePlate: entryData.car_plate_number,
        entryTime: new Date().toISOString(),
        exitTime: null,
        fee: null,
        status: 'active'
      };
      
      MOCK_PARKING_RECORDS.push(newRecord);
      
      // Create a mock response in the expected format
      return {
        success: true,
        data: {
          ticket: {
            id: newRecord.id,
            parking_lot_id: newRecord.parkingLotId,
            car_plate_number: newRecord.vehiclePlate,
            entry_time: newRecord.entryTime,
            exit_time: null,
            charged_amount: 0
          },
          parkingLot: MOCK_PARKING_LOTS.find(lot => lot.id === newRecord.parkingLotId) || null
        }
      };
    }
  },
  
  recordExit: async (recordId: string): Promise<{success: boolean, data: {bill: any, parkingLot: any}}> => {
    try {
      const response = await apiClient.put(`/parking-records/exit/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error recording vehicle exit:', error);
      toast.error('Failed to process vehicle exit');
      
      // Fallback to mock implementation
      const record = MOCK_PARKING_RECORDS.find(r => r.id === recordId);
      if (!record) {
        throw new Error('Parking record not found');
      }
      
      record.exitTime = new Date().toISOString();
      record.status = 'completed';
      
      // Calculate fee based on hourly rate and duration
      const parkingLot = MOCK_PARKING_LOTS.find(lot => lot.id === record.parkingLotId);
      const entryTime = new Date(record.entryTime).getTime();
      const exitTime = new Date(record.exitTime).getTime();
      const hoursParked = Math.ceil((exitTime - entryTime) / (1000 * 60 * 60));
      record.fee = hoursParked * (parkingLot?.hourlyRate || 5);
      
      // Create a mock response in the expected format
      return {
        success: true,
        data: {
          bill: {
            id: record.id,
            car_plate_number: record.vehiclePlate,
            parking_lot_id: record.parkingLotId,
            entry_time: record.entryTime,
            exit_time: record.exitTime,
            charged_amount: record.fee,
            durationHours: hoursParked,
            parking_lot_name: parkingLot?.name || 'Unknown'
          },
          parkingLot: parkingLot
        }
      };
    }
  },
  
  findByPlate: async (plateNumber: string): Promise<{success: boolean, data: any}> => {
    try {
      const response = await apiClient.get(`/parking-records/plate/${plateNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error finding vehicle by plate:', error);
      toast.error('Failed to find vehicle');
      
      // Fallback to mock implementation
      const record = MOCK_PARKING_RECORDS.find(
        r => r.vehiclePlate === plateNumber && r.status === 'active'
      );
      if (!record) {
        throw new Error('No active parking record found for this vehicle');
      }
      
      // Get the associated parking lot
      const parkingLot = MOCK_PARKING_LOTS.find(lot => lot.id === record.parkingLotId);
      
      // Create a mock response in the expected format
      return {
        success: true,
        data: {
          id: record.id,
          car_plate_number: record.vehiclePlate,
          parking_lot_id: record.parkingLotId,
          parking_lot_name: parkingLot?.name || 'Unknown',
          parking_lot_code: record.parkingLotId,
          entry_time: record.entryTime,
          exit_time: null,
          charged_amount: 0,
          created_at: record.entryTime,
          fee_per_hour: parkingLot?.hourlyRate || 0
        }
      };
    }
  }
};

// Reports service
export const reportsService = {
  getOutgoingCars: async (startDate: string, endDate: string): Promise<ReportResponse> => {
    try {
      const response = await apiClient.get('/reports/outgoing-cars', {
        params: { startDate, endDate }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching outgoing cars report:', error);
      toast.error('Failed to fetch outgoing cars report');
      
      // Fallback to mock implementation
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      
      const records = MOCK_PARKING_RECORDS.filter(r => {
        if (!r.exitTime) return false;
        const exitTime = new Date(r.exitTime).getTime();
        return exitTime >= start && exitTime <= end;
      });
      
      const totalAmount = records.reduce((sum, record) => sum + (record.fee || 0), 0);
      
      return {
        records,
        totalAmount
      };
    }
  },
  
  getEnteredCars: async (startDate: string, endDate: string): Promise<ReportResponse> => {
    try {
      const response = await apiClient.get('/reports/entered-cars', {
        params: { startDate, endDate }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching entered cars report:', error);
      toast.error('Failed to fetch entered cars report');
      
      // Fallback to mock implementation
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      
      const records = MOCK_PARKING_RECORDS.filter(r => {
        const entryTime = new Date(r.entryTime).getTime();
        return entryTime >= start && entryTime <= end;
      });
      
      return { records };
    }
  },
  
  getDashboardSummary: async (params?: { page?: number; limit?: number }): Promise<DashboardSummary> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `/reports/dashboard-summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      if (response.data && response.data.data) {
        return {
          todaySummary: response.data.data.todaySummary || { checkIns: 0, checkOuts: 0 },
          recentActivity: response.data.data.recentActivity || [],
          pagination: response.data.pagination || {
            total: response.data.data.recentActivity?.length || 0,
            totalPages: Math.ceil((response.data.data.recentActivity?.length || 0) / (params?.limit || 10)),
            currentPage: params?.page || 1
          }
        };
      }
      
      // Fallback to mock data
      return {
        todaySummary: {
          checkIns: 24,
          checkOuts: 18
        },
        recentActivity: [
          { id: 1, plateNumber: 'ABC123', activity: 'Entry', time: '2023-05-19 09:23:15' },
          { id: 2, plateNumber: 'XYZ789', activity: 'Exit', time: '2023-05-19 08:45:32' },
          { id: 3, plateNumber: 'DEF456', activity: 'Entry', time: '2023-05-19 08:15:48' }
        ],
        pagination: {
          total: 3,
          totalPages: Math.ceil(3 / (params?.limit || 10)),
          currentPage: params?.page || 1
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      // Fallback to mock data
      return {
        todaySummary: {
          checkIns: 24,
          checkOuts: 18
        },
        recentActivity: [
          { id: 1, plateNumber: 'ABC123', activity: 'Entry', time: '2023-05-19 09:23:15' },
          { id: 2, plateNumber: 'XYZ789', activity: 'Exit', time: '2023-05-19 08:45:32' },
          { id: 3, plateNumber: 'DEF456', activity: 'Entry', time: '2023-05-19 08:15:48' }
        ],
        pagination: {
          total: 3,
          totalPages: Math.ceil(3 / (params?.limit || 10)),
          currentPage: params?.page || 1
        }
      };
    }
  }
};

// No need to re-export types that are already exported above

export default {
  authService,
  parkingLotsService,
  parkingRecordsService,
  reportsService
};
