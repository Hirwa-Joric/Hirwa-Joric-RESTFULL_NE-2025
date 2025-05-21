import { useState, useEffect } from 'react';
import { parkingLotsService, type ParkingLot, reportsService } from '../../services/api';
import ModernDashboardLayout from '@/components/layout/ModernDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowUpRight, Clock, CheckCircle, XCircle, CircleDollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import logger from '@/utils/logger';
import Pagination from '@/components/ui/pagination';

interface ParkingLotSummary {
  total: number;
  occupied: number;
  available: number;
}

interface ActivityItem {
  id: number;
  plateNumber: string;
  activity: string;
  time: string;
}

interface RevenueData {
  today: number;
  dailyHistory: {date: string, amount: number}[];
  percentChange: number;
}

const AttendantDashboard = () => {
  const [parkingLotSummary, setParkingLotSummary] = useState<ParkingLotSummary>({
    total: 0,
    occupied: 0,
    available: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [todaySummary, setTodaySummary] = useState({
    checkIns: 0,
    checkOuts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    today: 0,
    dailyHistory: [],
    percentChange: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        logger.info('Fetching dashboard data');
        
        // Fetch parking lots data
        const lotsData = await parkingLotsService.getAll();
        logger.debug('Parking lots data received:', lotsData);
        
        if (Array.isArray(lotsData) && lotsData.length > 0) {
          // Calculate summary
          const totalSpaces = lotsData.reduce((sum, lot) => {
            // Check for capacity being a valid number
            return sum + (typeof lot.capacity === 'number' ? lot.capacity : 0);
          }, 0);
          
          const availableSpaces = lotsData.reduce((sum, lot) => {
            // Check for availableSpaces being a valid number
            return sum + (typeof lot.availableSpaces === 'number' ? lot.availableSpaces : 0);
          }, 0);
          
          const occupiedSpaces = totalSpaces - availableSpaces;
          
          setParkingLotSummary({
            total: totalSpaces,
            occupied: occupiedSpaces,
            available: availableSpaces,
          });
          
          logger.info('Parking lots data processed successfully');
        } else {
          // Handle empty or invalid response
          logger.warn('No parking lots data received or invalid format', lotsData);
          
          // Use mock data for summary if no parking lots data
          setParkingLotSummary({
            total: 450,
            occupied: 280,
            available: 170,
          });
          
          if (lotsData.length === 0) {
            toast.warning('No parking lots available');
          }
        }
        
        // Fetch dashboard summary data
        try {
          const dashboardData = await reportsService.getDashboardSummary();
          logger.debug('Dashboard summary data received:', dashboardData);
          
          if (dashboardData && dashboardData.recentActivity) {
            setRecentActivity(dashboardData.recentActivity);
            setTodaySummary(dashboardData.todaySummary);
            logger.info('Dashboard summary processed successfully');
          } else {
            // Fallback to mock data if API returns invalid data
            setRecentActivity([
              { id: 1, plateNumber: 'ABC123', activity: 'Entry', time: '2023-05-19 09:23:15' },
              { id: 2, plateNumber: 'XYZ789', activity: 'Exit', time: '2023-05-19 08:45:32' },
              { id: 3, plateNumber: 'DEF456', activity: 'Entry', time: '2023-05-19 08:15:48' }
            ]);
            setTodaySummary({
              checkIns: 24,
              checkOuts: 18
            });
            logger.warn('Using fallback data for dashboard summary');
          }
        } catch (summaryError: any) {
          logger.error('Error fetching dashboard summary:', summaryError);
          // Fallback to mock data
          setRecentActivity([
            { id: 1, plateNumber: 'ABC123', activity: 'Entry', time: '2023-05-19 09:23:15' },
            { id: 2, plateNumber: 'XYZ789', activity: 'Exit', time: '2023-05-19 08:45:32' },
            { id: 3, plateNumber: 'DEF456', activity: 'Entry', time: '2023-05-19 08:15:48' }
          ]);
          setTodaySummary({
            checkIns: 24,
            checkOuts: 18
          });
        }
        
        // Calculate revenue data (similar to AdminDashboard but simpler)
        try {
          // Get today's date and format
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Yesterday for percent change calculation
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          // Get the last 7 days for chart
          const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            return date;
          }).reverse();
          
          // Format dates for API
          const formatDateForAPI = (date: Date) => date.toISOString().split('T')[0];
          
          // Get records for the last 7 days
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 6);
          
          const response = await reportsService.getOutgoingCars(
            formatDateForAPI(sevenDaysAgo),
            formatDateForAPI(today)
          );
          
          // Calculate revenue
          let todayRevenue = 0;
          let yesterdayRevenue = 0;
          
          // Initialize daily history for chart
          const dailyHistory = last7Days.map(date => ({
            date: date.toLocaleDateString('en-US', {weekday: 'short'}),
            amount: 0
          }));
          
          // Process each record
          if (response && response.records) {
            response.records.forEach(record => {
              const exitTime = new Date(record.exitTime || record.exit_time || '');
              const amount = record.fee || record.charged_amount || 0;
              
              // Check if today
              if (exitTime.getDate() === today.getDate() && 
                  exitTime.getMonth() === today.getMonth() && 
                  exitTime.getFullYear() === today.getFullYear()) {
                todayRevenue += amount;
              }
              
              // Check if yesterday
              if (exitTime.getDate() === yesterday.getDate() && 
                  exitTime.getMonth() === yesterday.getMonth() && 
                  exitTime.getFullYear() === yesterday.getFullYear()) {
                yesterdayRevenue += amount;
              }
              
              // Add to chart data
              for (let i = 0; i < last7Days.length; i++) {
                const chartDate = last7Days[i];
                if (exitTime.getDate() === chartDate.getDate() && 
                    exitTime.getMonth() === chartDate.getMonth() && 
                    exitTime.getFullYear() === chartDate.getFullYear()) {
                  dailyHistory[i].amount += amount;
                  break;
                }
              }
            });
          }
          
          // Calculate percent change from yesterday
          const percentChange = yesterdayRevenue > 0 
            ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
            : 0;
          
          setRevenueData({
            today: todayRevenue,
            dailyHistory,
            percentChange
          });
          
        } catch (revenueError) {
          logger.error('Error calculating revenue data:', revenueError);
          
          // Fallback to realistic mock data
          setRevenueData({
            today: 350,
            dailyHistory: [
              { date: 'Mon', amount: 300 },
              { date: 'Tue', amount: 270 },
              { date: 'Wed', amount: 310 },
              { date: 'Thu', amount: 280 },
              { date: 'Fri', amount: 340 },
              { date: 'Sat', amount: 320 },
              { date: 'Sun', amount: 350 }
            ],
            percentChange: 2.5
          });
        }
      } catch (error: any) {
        logger.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to load dashboard data. Please try again later.');
        
        // Use mock data for summary if API call fails
        setParkingLotSummary({
          total: 450,
          occupied: 280,
          available: 170,
        });
        
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [retryCount]);

  const handleParkingOperations = () => {
    navigate('/attendant/operations');
  };
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <ModernDashboardLayout title="Attendant Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout 
      title="Attendant Dashboard" 
      subtitle="Manage parking operations and view current status"
    >
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Warning</h3>
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={handleRetry} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <Card className="border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Total Spaces</p>
                <h3 className="text-2xl font-bold text-slate-800">{parkingLotSummary.total}</h3>
                <p className="text-xs text-slate-400 mt-1">Across all parking lots</p>
              </div>
              <div className="bg-teal-50 p-2 rounded-lg">
                <Car className="h-6 w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Occupied Spaces</p>
                <h3 className="text-2xl font-bold text-slate-800">{parkingLotSummary.occupied}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {parkingLotSummary.total > 0 
                    ? ((parkingLotSummary.occupied / parkingLotSummary.total) * 100).toFixed(1) 
                    : '0'}% occupancy rate
                </p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Available Spaces</p>
                <h3 className="text-2xl font-bold text-slate-800">{parkingLotSummary.available}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {parkingLotSummary.total > 0 
                    ? ((parkingLotSummary.available / parkingLotSummary.total) * 100).toFixed(1) 
                    : '0'}% availability
                </p>
              </div>
              <div className="bg-green-50 p-2 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Today's Revenue</p>
                <h3 className="text-2xl font-bold text-slate-800">${revenueData.today.toFixed(2)}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  <span className={revenueData.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {revenueData.percentChange >= 0 ? '+' : ''}{revenueData.percentChange.toFixed(1)}%
                  </span> from yesterday
                </p>
              </div>
              <div className="bg-teal-50 p-2 rounded-lg">
                <CircleDollarSign className="h-6 w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
              <Button variant="outline" size="sm" className="text-xs">View All</Button>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left pb-3 font-medium text-slate-500">Plate Number</th>
                        <th className="text-left pb-3 font-medium text-slate-500">Activity</th>
                        <th className="text-left pb-3 font-medium text-slate-500">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((activity) => (
                        <tr key={activity.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 font-medium">{activity.plateNumber}</td>
                          <td className="py-3">
                            <Badge variant={activity.activity === 'Entry' ? 'default' : 'outline'} className={
                              activity.activity === 'Entry' 
                                ? 'bg-teal-100 text-teal-800 hover:bg-teal-100' 
                                : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100'
                            }>
                              {activity.activity === 'Entry' ? (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              ) : (
                                <XCircle className="mr-1 h-3 w-3" />
                              )}
                              {activity.activity}
                            </Badge>
                          </td>
                          <td className="py-3 text-slate-500">{activity.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Car className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-slate-800 font-medium mb-1">No recent activity</h3>
                  <p className="text-slate-500 text-sm mb-4">Parking activities will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-teal-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-teal-100 rounded-full mr-3">
                  <CheckCircle className="h-5 w-5 text-teal-500" />
                </div>
                <span className="font-medium">Check-ins</span>
              </div>
              <span className="text-2xl font-bold">{todaySummary.checkIns}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-full mr-3">
                  <XCircle className="h-5 w-5 text-indigo-500" />
                </div>
                <span className="font-medium">Check-outs</span>
              </div>
              <span className="text-2xl font-bold">{todaySummary.checkOuts}</span>
            </div>
            
            <Button 
              onClick={handleParkingOperations}
              className="w-full bg-teal-500 hover:bg-teal-600 mt-2"
            >
              Parking Operations
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-0 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Revenue Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Revenue chart */}
            <div className="bg-white rounded-lg h-[220px] w-full flex flex-col">
              <div className="relative w-full h-full px-4 pt-4">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-400 pt-6 pb-8">
                  <div>$800</div>
                  <div>$600</div>
                  <div>$400</div>
                  <div>$200</div>
                  <div>$0</div>
                </div>
                
                {/* Grid lines */}
                <div className="absolute left-8 right-4 top-6 bottom-8 flex flex-col justify-between">
                  <div className="border-t border-slate-100 w-full h-0"></div>
                  <div className="border-t border-slate-100 w-full h-0"></div>
                  <div className="border-t border-slate-100 w-full h-0"></div>
                  <div className="border-t border-slate-100 w-full h-0"></div>
                  <div className="border-t border-slate-100 w-full h-0"></div>
                </div>
                
                {/* Chart visualization */}
                <div className="flex h-[160px] items-end space-x-1 pt-5 pb-2 ml-8">
                  {revenueData.dailyHistory.map((day, index) => {
                    // Calculate height percentage based on maximum value
                    const maxAmount = Math.max(...revenueData.dailyHistory.map(d => d.amount));
                    const heightPercent = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                    
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            {day.date}: ${day.amount.toFixed(2)}
                          </div>
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800 mx-auto"></div>
                        </div>
                        
                        {/* Bar */}
                        <div 
                          className={`w-full ${index % 2 === 0 ? 'bg-gradient-to-t from-teal-500 to-teal-400' : 'bg-gradient-to-t from-teal-400 to-teal-300'} rounded-t-sm group-hover:bg-teal-600 transition-colors relative`}
                          style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                        >
                          {/* Value indicator dot */}
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-white border border-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        
                        {/* X-axis label */}
                        <div className="text-xs font-medium text-slate-500 mt-2">{day.date}</div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Stats overlay */}
                <div className="absolute top-4 right-4 bg-white/90 text-xs px-3 py-2 rounded-md border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <span className="text-slate-700">Daily avg: <span className="font-medium">${(revenueData.dailyHistory.reduce((sum, day) => sum + day.amount, 0) / 7).toFixed(2)}</span></span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-slate-700">
                      Growth: <span className={`font-medium ${revenueData.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {revenueData.percentChange >= 0 ? '+' : ''}{revenueData.percentChange.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernDashboardLayout>
  );
};

export default AttendantDashboard;
