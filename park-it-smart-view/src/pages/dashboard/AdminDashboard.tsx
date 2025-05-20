import { useState, useEffect } from 'react';
import { parkingLotsService, reportsService, type ParkingLot } from '../../services/api';
import ModernDashboardLayout from '@/components/layout/ModernDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  CircleDollarSign, 
  TrendingUp, 
  Car, 
  ArrowUpRight, 
  BadgeCheck, 
  FilePlus, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import logger from '@/utils/logger';

interface ParkingLotSummary {
  total: number;
  occupied: number;
  available: number;
}

interface RevenueData {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

interface ActivityItem {
  id: number;
  plateNumber: string;
  activity: string;
  time: string;
}

const AdminDashboard = () => {
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
  const [revenueData, setRevenueData] = useState<RevenueData>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        logger.info('Fetching dashboard data');
        
        // Fetch parking lots data
        const lotsData = await parkingLotsService.getAll();
        logger.debug('Parking lots data received:', lotsData);
        
        // Calculate summary
        const totalSpaces = lotsData.reduce((sum: number, lot: ParkingLot) => sum + lot.capacity, 0);
        const occupiedSpaces = lotsData.reduce((sum: number, lot: ParkingLot) => sum + (lot.capacity - lot.availableSpaces), 0);
        
        setParkingLotSummary({
          total: totalSpaces,
          occupied: occupiedSpaces,
          available: totalSpaces - occupiedSpaces,
        });
        
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
        
        // Mock revenue data (would come from the reports service in a real application)
        setRevenueData({
          today: 450,
          thisWeek: 2850,
          thisMonth: 12450,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const handleAddParkingLot = () => {
    navigate('/admin/parking-lots/new');
  };

  const handleViewReports = () => {
    navigate('/admin/reports');
  };

  if (isLoading) {
    return (
      <ModernDashboardLayout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout 
      title="Admin Dashboard" 
      subtitle="Monitor your parking system performance and revenue"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
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
                  {((parkingLotSummary.occupied / parkingLotSummary.total) * 100).toFixed(1)}% occupancy rate
                </p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-indigo-500" />
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
                  {((parkingLotSummary.available / parkingLotSummary.total) * 100).toFixed(1)}% availability
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
                <p className="text-xs text-slate-400 mt-1">+2.5% from yesterday</p>
              </div>
              <div className="bg-orange-50 p-2 rounded-lg">
                <CircleDollarSign className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-0 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">This Week</p>
                <p className="text-2xl font-semibold">${revenueData.thisWeek.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">This Month</p>
                <p className="text-2xl font-semibold">${revenueData.thisMonth.toFixed(2)}</p>
              </div>
              <div>
                <Button 
                  size="sm"
                  onClick={handleViewReports}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  View Reports
                  <BarChart3 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Placeholder for chart */}
            <div className="bg-slate-50 rounded-lg h-[180px] flex items-center justify-center">
              <p className="text-slate-400 text-sm">Revenue chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>
        
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
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center">
                <p className="text-xs text-slate-500">Last updated {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Recent Activities</CardTitle>
            <Button variant="outline" size="sm" className="text-xs">View All</Button>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center p-2 rounded-lg hover:bg-slate-50">
                    <div className={`p-2 rounded-lg mr-3 ${
                      activity.activity === 'Entry' ? 'bg-teal-50' : 'bg-indigo-50'
                    }`}>
                      {activity.activity === 'Entry' ? (
                        <CheckCircle className={`h-4 w-4 ${
                          activity.activity === 'Entry' ? 'text-teal-500' : 'text-indigo-500'
                        }`} />
                      ) : (
                        <XCircle className={`h-4 w-4 ${
                          activity.activity === 'Entry' ? 'text-teal-500' : 'text-indigo-500'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Vehicle {activity.plateNumber} {activity.activity === 'Entry' ? 'entered' : 'exited'} parking
                      </p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
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
        
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button 
              onClick={handleAddParkingLot}
              className="justify-start bg-teal-500 hover:bg-teal-600"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              Add New Parking Lot
            </Button>
            
            <Button 
              onClick={handleViewReports} 
              variant="outline"
              className="justify-start"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Button>
            
            <Button 
              onClick={() => navigate('/parking-lots')} 
              variant="outline"
              className="justify-start"
            >
              <Car className="h-4 w-4 mr-2" />
              Manage Parking Lots
            </Button>
          </CardContent>
        </Card>
      </div>
    </ModernDashboardLayout>
  );
};

export default AdminDashboard;
