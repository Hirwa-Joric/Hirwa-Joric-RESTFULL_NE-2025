import { useState, useEffect } from 'react';
import { parkingLotsService } from '@/services/api';
import parkingRecordsService, { ParkingRecord } from '@/services/parkingRecordService';
import ModernDashboardLayout from '@/components/layout/ModernDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  LogIn, 
  LogOut, 
  Clock, 
  Search, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import Pagination from '@/components/ui/pagination';

interface ParkingLot {
  id: string;
  code: string;
  name: string;
  location: string;
  totalSpaces: number;
  occupiedSpaces: number;
  chargingFeePerHour: number;
}

interface ExitTicket {
  id: string;
  plateNumber: string;
  parkingLot: string;
  entryTime: string;
  exitTime: string;
  durationInHours: number;
  totalCharge: number;
}

// Map API parking lot to view model
const mapApiParkingLotToView = (apiLot: any): ParkingLot => {
  // Log the lot to see what fields are available
  console.log('ParkingOperations mapping lot:', apiLot);
  
  // Parse numerical values to ensure they're numbers
  const totalSpaces = parseInt(apiLot.capacity) || parseInt(apiLot.total_spaces) || 0;
  const availableSpaces = parseInt(apiLot.availableSpaces) || parseInt(apiLot.available_spaces) || 0;
  const feePerHour = parseFloat(apiLot.hourlyRate) || parseFloat(apiLot.fee_per_hour) || 0;
  
  // Calculate occupied spaces
  const occupiedSpaces = Math.max(0, totalSpaces - availableSpaces);
  
  // Create the view model
  const result: ParkingLot = {
    id: apiLot.id || '',
    name: apiLot.name || 'Unknown',
    code: apiLot.code || apiLot.id || '',
    location: apiLot.location || '',
    totalSpaces: totalSpaces,
    occupiedSpaces: occupiedSpaces,
    chargingFeePerHour: feePerHour
  };
  
  // Log the result for debugging
  console.log('ParkingOperations mapped to view model:', result);
  
  return result;
};

const ParkingOperations = () => {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [isFindingVehicle, setIsFindingVehicle] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [exitTicket, setExitTicket] = useState<ExitTicket | null>(null);
  const [operationMessage, setOperationMessage] = useState({ type: '', message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  const [recentRecords, setRecentRecords] = useState<ParkingRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        console.log('Fetching parking lots...');
        const lotsData = await parkingLotsService.getAll();
        console.log('Parking lots data received:', lotsData);
        
        // Map API parking lots to the format expected by the component
        const mappedLots = Array.isArray(lotsData.data) 
          ? lotsData.data.map(mapApiParkingLotToView)
          : [];
        console.log('Mapped parking lots:', mappedLots);
        
        setParkingLots(mappedLots);
        
        if (mappedLots.length > 0) {
          setSelectedLotId(mappedLots[0].id);
        }
      } catch (error) {
        console.error('Error fetching parking lots:', error);
      }
    };
    
    fetchParkingLots();
  }, []);

  // Add a new effect to fetch recent records with pagination
  useEffect(() => {
    const fetchRecentRecords = async () => {
      setIsLoadingRecords(true);
      try {
        const response = await parkingRecordsService.getAll({
          page: currentPage,
          limit: pageSize
        });
        
        if (response.success && Array.isArray(response.data.records)) {
          setRecentRecords(response.data.records);
          setTotalItems(response.data.total || response.data.records.length);
          setTotalPages(response.data.totalPages || Math.ceil(response.data.records.length / pageSize));
        } else {
          setRecentRecords([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching recent records:', error);
        setRecentRecords([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setIsLoadingRecords(false);
      }
    };
    
    fetchRecentRecords();
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCheckIn = async () => {
    if (!selectedLotId || !plateNumber) {
      setOperationMessage({ 
        type: 'error', 
        message: 'Please select a parking lot and enter a plate number' 
      });
      return;
    }
    
    setIsCheckingIn(true);
    
    try {
      // Create the entry data with the correct field names
      const entryData = {
        car_plate_number: plateNumber,
        parking_lot_id: selectedLotId
      };
      
      // Create a parking record for the vehicle check-in
      const response = await parkingRecordsService.createEntry(entryData);
      
      if (response.success && response.data.ticket) {
        // Get the ticket info from the response
        const ticket = response.data.ticket;
        
        // Clear form and show success message
        setPlateNumber('');
        setOperationMessage({ 
          type: 'success', 
          message: `Vehicle with plate number ${plateNumber} has been checked in successfully. Ticket ID: ${ticket.id || 'N/A'}` 
        });
        
        // Refresh the parking lots to update the available spaces
        const lotsData = await parkingLotsService.getAll();
        const mappedLots = lotsData.map(mapApiParkingLotToView);
        setParkingLots(mappedLots);
      } else {
        throw new Error('Failed to create parking entry');
      }
    } catch (error) {
      console.error('Error checking in vehicle:', error);
      setOperationMessage({ 
        type: 'error', 
        message: 'Failed to check in the vehicle. Please try again.' 
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleFindVehicle = async () => {
    if (!plateNumber) {
      setOperationMessage({ 
        type: 'error', 
        message: 'Please enter a plate number to search' 
      });
      return;
    }
    
    setIsFindingVehicle(true);
    setExitTicket(null);
    
    try {
      // Find the active parking record for the vehicle
      const response = await parkingRecordsService.findByPlate(plateNumber);
      
      if (response.success && response.data) {
        const activeRecord = response.data;
        
        // Get parking lot information
        let parkingLotName = 'Unknown';
        
        // The backend response includes parking_lot_name already
        if (activeRecord.parking_lot_name) {
          parkingLotName = activeRecord.parking_lot_name;
        } else if (activeRecord.parking_lot_id) {
          // Fallback: Try to find the parking lot to get its name
          const matchingLot = parkingLots.find(lot => lot.id === activeRecord.parking_lot_id);
          if (matchingLot) {
            parkingLotName = matchingLot.name;
          }
        }
        
        setOperationMessage({ 
          type: 'success', 
          message: `Vehicle found! Parked at ${parkingLotName}` 
        });
        
        // Set the selected lot to the one where the vehicle is parked
        if (activeRecord.parking_lot_id) {
          setSelectedLotId(activeRecord.parking_lot_id);
        }
      } else {
        setOperationMessage({ 
          type: 'error', 
          message: 'No active parking record found for this vehicle' 
        });
      }
    } catch (error) {
      console.error('Error finding vehicle:', error);
      setOperationMessage({ 
        type: 'error', 
        message: 'No active parking record found for this vehicle' 
      });
    } finally {
      setIsFindingVehicle(false);
    }
  };

  const handleCheckOut = async () => {
    if (!plateNumber) {
      setOperationMessage({ 
        type: 'error', 
        message: 'Please enter a plate number to check out' 
      });
      return;
    }
    
    setIsCheckingOut(true);
    
    try {
      // Process the vehicle checkout
      // First find the vehicle record to get the ID
      let recordId;
      try {
        const findResponse = await parkingRecordsService.findByPlate(plateNumber);
        
        if (findResponse.success && findResponse.data) {
          recordId = findResponse.data.id;
        } else {
          throw new Error('No active parking record found for this vehicle');
        }
      } catch (error) {
        setOperationMessage({ 
          type: 'error', 
          message: 'No active parking record found for this vehicle' 
        });
        setIsCheckingOut(false);
        return;
      }
      
      // Now record the exit using the record ID
      const response = await parkingRecordsService.recordExit(recordId);
      
      if (response.success && response.data.bill) {
        const exitTicketData = response.data.bill;
        
        // Create a formatted exit ticket
        const ticket: ExitTicket = {
          id: exitTicketData.id || '',
          plateNumber: exitTicketData.car_plate_number || plateNumber,
          parkingLot: exitTicketData.parking_lot_name || 'Unknown',
          entryTime: exitTicketData.entry_time || 'Unknown',
          exitTime: exitTicketData.exit_time || new Date().toISOString(),
          durationInHours: typeof exitTicketData.durationHours === 'number' ? exitTicketData.durationHours : 0,
          totalCharge: typeof exitTicketData.charged_amount === 'number' ? exitTicketData.charged_amount : 0
        };
        
        setExitTicket(ticket);
        setOperationMessage({ 
          type: 'success', 
          message: `Vehicle with plate number ${plateNumber} has been checked out successfully` 
        });
        setPlateNumber('');
        
        // Refresh the parking lots to update the available spaces
        const lotsData = await parkingLotsService.getAll();
        const mappedLots = lotsData.map(mapApiParkingLotToView);
        setParkingLots(mappedLots);
      } else {
        setOperationMessage({ 
          type: 'error', 
          message: 'Failed to check out the vehicle' 
        });
      }
    } catch (error) {
      console.error('Error checking out vehicle:', error);
      setOperationMessage({ 
        type: 'error', 
        message: 'Failed to check out the vehicle. Please try again.' 
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const clearResults = () => {
    setExitTicket(null);
    setOperationMessage({ type: '', message: '' });
  };

  return (
    <ModernDashboardLayout 
      title="Parking Operations" 
      subtitle="Check in and check out vehicles from your parking lots"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Parking Lots Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200">
                      <th className="text-left py-3 px-6 font-medium text-slate-500">Name</th>
                      <th className="text-left py-3 px-6 font-medium text-slate-500">Location</th>
                      <th className="text-center py-3 px-6 font-medium text-slate-500">Total Spaces</th>
                      <th className="text-center py-3 px-6 font-medium text-slate-500">Occupied</th>
                      <th className="text-center py-3 px-6 font-medium text-slate-500">Available</th>
                      <th className="text-right py-3 px-6 font-medium text-slate-500">Fee/Hour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parkingLots.map((lot) => (
                      <tr key={lot.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="py-3 px-6 font-medium">{lot.name}</td>
                        <td className="py-3 px-6">{lot.location}</td>
                        <td className="py-3 px-6 text-center">{lot.totalSpaces || 0}</td>
                        <td className="py-3 px-6 text-center">{lot.occupiedSpaces || 0}</td>
                        <td className="py-3 px-6 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (lot.totalSpaces - lot.occupiedSpaces) > 5 
                              ? 'bg-green-100 text-green-800' 
                              : (lot.totalSpaces - lot.occupiedSpaces) > 0 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {(lot.totalSpaces - lot.occupiedSpaces) >= 0 ? (lot.totalSpaces - lot.occupiedSpaces) : 0}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right font-medium">
                          ${(typeof lot.chargingFeePerHour === 'number' && !isNaN(lot.chargingFeePerHour))
                            ? lot.chargingFeePerHour.toFixed(2) 
                            : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {exitTicket && (
            <Card className="border-0 shadow-sm bg-teal-50">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Exit Ticket</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-6 rounded-lg border border-teal-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-dashed border-slate-200">
                    <div>
                      <h3 className="text-xl font-bold">ParkWise Receipt</h3>
                      <p className="text-slate-500 text-sm">Thank you for using our parking service</p>
                    </div>
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Paid
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Plate Number</p>
                        <p className="font-semibold">{exitTicket.plateNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Parking Lot</p>
                        <p className="font-semibold">{exitTicket.parkingLot}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Entry Time</p>
                        <p>{exitTicket.entryTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Exit Time</p>
                        <p>{exitTicket.exitTime}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Duration</p>
                        <p>{exitTicket.durationInHours ? exitTicket.durationInHours.toFixed(1) : '0.0'} hours</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Parking Fee</p>
                        <p className="font-bold text-lg">${exitTicket.totalCharge ? exitTicket.totalCharge.toFixed(2) : '0.00'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                    <Button variant="outline" onClick={clearResults}>Close</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {operationMessage.message && !exitTicket && (
            <div className={`p-4 rounded-lg ${
              operationMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            } flex items-start`}>
              {operationMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">{operationMessage.type === 'success' ? 'Success' : 'Error'}</p>
                <p className="text-sm">{operationMessage.message}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Vehicle Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Parking Lot</label>
                <select 
                  value={selectedLotId} 
                  onChange={(e) => setSelectedLotId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {parkingLots.map((lot) => (
                    <option 
                      key={lot.id} 
                      value={lot.id}
                      disabled={lot.totalSpaces === lot.occupiedSpaces}
                    >
                      {lot.name} ({lot.totalSpaces - lot.occupiedSpaces} available)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Plate Number</label>
                <div className="flex space-x-2">
                  <Input 
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="e.g. ABC123"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleFindVehicle}
                    disabled={isFindingVehicle || !plateNumber}
                  >
                    {isFindingVehicle ? (
                      <span className="animate-spin h-4 w-4 border-2 border-slate-500 rounded-full border-t-transparent" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <Button 
                  onClick={handleCheckIn}
                  disabled={isCheckingIn || !plateNumber || !selectedLotId}
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
                >
                  {isCheckingIn ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Check In
                </Button>
                
                <Button 
                  onClick={handleCheckOut}
                  disabled={isCheckingOut || !plateNumber}
                  variant="outline"
                  className="flex-1"
                >
                  {isCheckingOut ? (
                    <span className="animate-spin h-4 w-4 border-2 border-slate-500 rounded-full border-t-transparent mr-2" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Check Out
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Quick Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="bg-teal-50 p-2 rounded-md mr-3">
                    <LogIn className="h-4 w-4 text-teal-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Vehicle Entry</h4>
                    <p className="text-xs text-slate-500">Select a parking lot, enter plate number, and click "Check In"</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="bg-indigo-50 p-2 rounded-md mr-3">
                    <Search className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Find Vehicle</h4>
                    <p className="text-xs text-slate-500">Enter plate number and click the search icon</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="bg-orange-50 p-2 rounded-md mr-3">
                    <LogOut className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Vehicle Exit</h4>
                    <p className="text-xs text-slate-500">Enter plate number and click "Check Out" to generate a receipt</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="bg-slate-100 p-2 rounded-md mr-3">
                    <Clock className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Fee Calculation</h4>
                    <p className="text-xs text-slate-500">Fees are calculated based on the duration and hourly rates</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Operations Table with Pagination */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No recent parking operations found
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Parking Lot
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Entry Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Exit Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Fee
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {recentRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {record.vehiclePlate || record.car_plate_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {record.parkingLotName || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(record.entryTime || record.entry_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {record.exitTime || record.exit_time 
                            ? new Date(record.exitTime || record.exit_time).toLocaleString() 
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${record.exitTime || record.exit_time ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {record.exitTime || record.exit_time ? 'Completed' : 'Active'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {(record.fee || record.charged_amount) 
                            ? `$${Number(record.fee || record.charged_amount).toFixed(2)}` 
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination component */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  className="mt-4"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </ModernDashboardLayout>
  );
};

export default ParkingOperations;
