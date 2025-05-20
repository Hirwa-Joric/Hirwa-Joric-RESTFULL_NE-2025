import apiClient from './apiClient';
import logger from '../utils/logger';

// Types for dashboard summary
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
}

// Define the report entry interface
export interface ReportEntry {
  id: string;
  plateNumber: string;
  parkingLotName: string;
  entryTime: string;
  exitTime: string;
  duration: number;
  fee: number;
}

// Types for reports
export interface ReportResponse {
  success: boolean;
  records: ReportEntry[];
  summary: {
    totalAmount?: number;
    totalRecords: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Helper function to get current date in ISO format
const getCurrentDate = () => new Date().toISOString().split('T')[0];

// Helper function to get first day of current month in ISO format
const getFirstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

// Helper function to format dates for display
export const formatDate = (dateString: string) => {
  if (!dateString || dateString === 'N/A') return 'N/A';
  return new Date(dateString).toLocaleString();
};

// Report services
const reportService = {
  // Get dashboard summary
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    try {
      logger.debug('Fetching dashboard summary');
      const response = await apiClient.get('/reports/dashboard-summary');
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching dashboard summary:', error);
      // Return default data on error to prevent app crash
      return {
        todaySummary: {
          checkIns: 0,
          checkOuts: 0
        },
        recentActivity: []
      };
    }
  },

  // Get outgoing cars report
  getOutgoingCarsReport: async (
    startDate: string, 
    endDate: string, 
    page = 1, 
    limit = 10
  ): Promise<ReportResponse> => {
    try {
      logger.debug(`Fetching outgoing cars report from ${startDate} to ${endDate}, page ${page}`);
      const response = await apiClient.get('/reports/outgoing-cars', {
        params: { startDate, endDate, page, limit }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching outgoing cars report:', error);
      // Return empty data on error to prevent app crash
      return {
        success: false,
        records: [],
        summary: {
          totalAmount: 0,
          totalRecords: 0
        },
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      };
    }
  },

  // Get entered cars report
  getEnteredCarsReport: async (
    startDate: string, 
    endDate: string,
    page = 1,
    limit = 10
  ): Promise<ReportResponse> => {
    try {
      logger.debug(`Fetching entered cars report from ${startDate} to ${endDate}, page ${page}`);
      const response = await apiClient.get('/reports/entered-cars', {
        params: { startDate, endDate, page, limit }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching entered cars report:', error);
      // Return empty data on error to prevent app crash
      return {
        success: false,
        records: [],
        summary: {
          totalRecords: 0
        },
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      };
    }
  },
  
  // Get daily report (today's data)
  getDaily: async (page = 1, limit = 10): Promise<{ records: ReportEntry[], totalAmount: number }> => {
    try {
      const today = getCurrentDate();
      logger.debug(`Fetching daily report for date: ${today}`);
      
      // Use the outgoing cars report with today's date
      const response = await reportService.getOutgoingCarsReport(today, today, page, limit);
      
      return {
        records: response.records || [],
        totalAmount: response.summary?.totalAmount || 0
      };
    } catch (error) {
      logger.error('Error fetching daily report:', error);
      // Return empty data on error to prevent app crash
      return { records: [], totalAmount: 0 };
    }
  },
  
  // Get monthly report (current month data)
  getMonthly: async (page = 1, limit = 10): Promise<{ records: ReportEntry[], totalAmount: number }> => {
    try {
      const firstDay = getFirstDayOfMonth();
      const today = getCurrentDate();
      logger.debug(`Fetching monthly report from ${firstDay} to ${today}`);
      
      // Use the outgoing cars report with current month date range
      const response = await reportService.getOutgoingCarsReport(firstDay, today, page, limit);
      
      return {
        records: response.records || [],
        totalAmount: response.summary?.totalAmount || 0
      };
    } catch (error) {
      logger.error('Error fetching monthly report:', error);
      // Return empty data on error to prevent app crash
      return { records: [], totalAmount: 0 };
    }
  },

  // Get custom date range report for outgoing cars
  getCustomOutgoingReport: async (startDate: string, endDate: string, page = 1, limit = 10): Promise<{ records: ReportEntry[], totalAmount: number }> => {
    try {
      logger.debug(`Fetching custom outgoing report from ${startDate} to ${endDate}`);
      const response = await reportService.getOutgoingCarsReport(startDate, endDate, page, limit);
      
      return {
        records: response.records || [],
        totalAmount: response.summary?.totalAmount || 0
      };
    } catch (error) {
      logger.error('Error fetching custom outgoing report:', error);
      return { records: [], totalAmount: 0 };
    }
  },

  // Get custom date range report for entered cars
  getCustomEnteredReport: async (startDate: string, endDate: string, page = 1, limit = 10): Promise<{ records: ReportEntry[], totalAmount: number }> => {
    try {
      logger.debug(`Fetching custom entered report from ${startDate} to ${endDate}`);
      const response = await reportService.getEnteredCarsReport(startDate, endDate, page, limit);
      
      return {
        records: response.records || [],
        totalAmount: 0 // Entered cars don't have a total amount
      };
    } catch (error) {
      logger.error('Error fetching custom entered report:', error);
      return { records: [], totalAmount: 0 };
    }
  }
};

export default reportService;