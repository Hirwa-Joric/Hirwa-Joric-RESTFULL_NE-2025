
import { useState, useEffect } from 'react';
import { parkingLotsService, type ParkingLot as ApiParkingLot } from '../../services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ModernDashboardLayout from '@/components/layout/ModernDashboardLayout';
import { Plus, MoreVertical } from 'lucide-react';

interface ParkingLot {
  id: string;
  code: string;
  name: string;
  totalSpaces: number;
  occupiedSpaces: number;
  location: string;
  chargingFeePerHour: number;
}

// Map API parking lot to component parking lot
const mapApiParkingLotToView = (apiLot: ApiParkingLot): ParkingLot => {
  return {
    id: apiLot.id,
    name: apiLot.name,
    code: apiLot.id, // Using id as code since API doesn't have code
    location: apiLot.location,
    totalSpaces: apiLot.capacity,
    occupiedSpaces: apiLot.capacity - apiLot.availableSpaces,
    chargingFeePerHour: apiLot.hourlyRate
  };
};

const ParkingLots = () => {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        const lotsData = await parkingLotsService.getAll();
        // Map API parking lots to the format expected by the component
        const mappedLots = lotsData.map(mapApiParkingLotToView);
        setParkingLots(mappedLots);
      } catch (error) {
        console.error('Error fetching parking lots:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchParkingLots();
  }, []);

  return (
    <ModernDashboardLayout 
      title="Manage Parking Lots" 
      subtitle="view and manage all your parking facilities in one place"
    >
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-slate-500">
          {parkingLots.length} parking lots available
        </div>
        
        {user?.role === 'Admin' && (
          <Button 
            onClick={() => navigate('/admin/parking-lots/new')}
            className="bg-teal-500 hover:bg-teal-600 text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Parking Lot
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 animate-pulse">
              <CardContent className="p-5 h-48"></CardContent>
            </Card>
          ))}
        </div>
      ) : parkingLots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">No parking lots found</h3>
          <p className="text-slate-500 mb-6 max-w-md">Start by creating your first parking lot to manage spaces and track occupancy</p>
          
          {user?.role === 'Admin' && (
            <Button 
              onClick={() => navigate('/admin/parking-lots/new')}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Parking Lot
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parkingLots.map((lot, index) => (
            <Card key={lot.id} className="rounded-2xl overflow-hidden border-0 shadow hover:shadow-md transition-all duration-200">
              <div className={`h-2 ${index % 3 === 0 ? 'bg-teal-500' : index % 3 === 1 ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${index % 3 === 0 ? 'bg-teal-50 text-teal-700' : index % 3 === 1 ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                      0{index + 1}
                    </span>
                    <h3 className="font-medium text-lg text-slate-800 mt-2">{lot.name}</h3>
                    <p className="text-sm text-slate-500">{lot.location}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Capacity</span>
                    <span className="font-medium text-slate-800">{lot.totalSpaces} spaces</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Available</span>
                    <span className={`font-medium ${
                      lot.totalSpaces - lot.occupiedSpaces > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {lot.totalSpaces - lot.occupiedSpaces} spaces
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Rate</span>
                    <span className="font-medium text-slate-800">${lot.chargingFeePerHour}/hr</span>
                  </div>
                  
                  <div>
                    <div className="bg-slate-100 rounded-full h-2 w-full mt-2">
                      <div 
                        className={`h-2 rounded-full ${index % 3 === 0 ? 'bg-teal-500' : index % 3 === 1 ? 'bg-indigo-500' : 'bg-orange-500'}`}
                        style={{ width: `${Math.min(100, (lot.occupiedSpaces / lot.totalSpaces) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 flex justify-between text-xs">
                      <span className="text-slate-500">Usage</span>
                      <span className="text-slate-600 font-medium">
                        {Math.round((lot.occupiedSpaces / lot.totalSpaces) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {user?.role === 'Admin' && (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center h-full min-h-[240px] hover:border-teal-500 transition-colors cursor-pointer" onClick={() => navigate('/admin/parking-lots/new')}>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-teal-500" />
                </div>
                <p className="text-sm font-medium text-slate-800">Add New Parking Lot</p>
                <p className="text-xs text-slate-500 mt-1">Create a new parking facility</p>
              </div>
            </div>
          )}
        </div>
      )}
    </ModernDashboardLayout>
  );
};

export default ParkingLots;
