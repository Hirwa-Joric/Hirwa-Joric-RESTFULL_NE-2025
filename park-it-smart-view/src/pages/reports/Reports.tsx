import { useState, useEffect } from 'react';
import reportService, { ReportEntry, formatDate } from '@/services/reportService';
import ModernDashboardLayout from '@/components/layout/ModernDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calendar, Download, Filter, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import logger from '@/utils/logger';

interface ReportData {
  records: ReportEntry[];
  totalAmount: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const Reports = () => {
  // State for the active report tab (outgoing or entered)
  const [activeTab, setActiveTab] = useState('outgoing');
  
  // State for report type (daily, monthly, custom)
  const [reportType, setReportType] = useState('daily');
  
  // State for date range
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // State for report data
  const [outgoingReport, setOutgoingReport] = useState<ReportData>({ 
    records: [], 
    totalAmount: 0,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 }
  });
  
  const [enteredReport, setEnteredReport] = useState<ReportData>({ 
    records: [], 
    totalAmount: 0,
    pagination: { page: 1, limit: 10, total: 0, pages: 0 }
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to set date range based on report type
  const setDateRangeForReportType = (type: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (type === 'daily') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'monthly') {
      const firstDay = new Date();
      firstDay.setDate(1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(today);
    }
    // For 'custom', keep the user-selected dates
  };

  // Function to fetch report data based on active tab, report type, and date range
  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch data based on active tab
      if (activeTab === 'outgoing') {
        if (reportType === 'daily') {
          const data = await reportService.getDaily(currentPage, pageSize);
          setOutgoingReport(data);
        } else if (reportType === 'monthly') {
          const data = await reportService.getMonthly(currentPage, pageSize);
          setOutgoingReport(data);
        } else {
          // Custom date range
          const data = await reportService.getCustomOutgoingReport(startDate, endDate, currentPage, pageSize);
          setOutgoingReport(data);
        }
      } else if (activeTab === 'entered') {
        // Entered cars report
        const data = await reportService.getCustomEnteredReport(startDate, endDate, currentPage, pageSize);
        setEnteredReport(data);
      }
    } catch (error) {
      logger.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to update date range when report type changes
  useEffect(() => {
    setDateRangeForReportType(reportType);
  }, [reportType]);

  // Effect to fetch data when relevant state changes
  useEffect(() => {
    fetchReportData();
  }, [activeTab, reportType, startDate, endDate, currentPage, pageSize]);

  // Get the currently active report data
  const currentReport = activeTab === 'outgoing' ? outgoingReport : enteredReport;

  // Handler for applying custom date filter
  const handleApplyFilter = () => {
    setReportType('custom');
    setCurrentPage(1);
    fetchReportData();
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentReport.pagination && currentPage < currentReport.pagination.pages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (isLoading && !currentReport.records.length) {
    return (
      <ModernDashboardLayout title="Reports">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout 
      title="Revenue Reports" 
      subtitle="View and analyze your parking system revenue data"
    >
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <Card className="border-0 shadow-sm flex-1">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Today's Revenue</p>
                <h3 className="text-3xl font-bold text-slate-800">${outgoingReport.totalAmount.toFixed(2)}</h3>
                <p className="text-xs text-green-500 mt-1">Today's revenue</p>
              </div>
              <div className="bg-teal-50 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm flex-1">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Monthly Revenue</p>
                <h3 className="text-3xl font-bold text-slate-800">${enteredReport.totalAmount.toFixed(2)}</h3>
                <p className="text-xs text-green-500 mt-1">This month's total</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>
                Transaction History
                {isLoading && (
                  <RefreshCcw className="h-4 w-4 ml-2 inline animate-spin" />
                )}
              </CardTitle>
              
              <div className="flex flex-wrap gap-2">
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full md:w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="outgoing">Outgoing Cars</TabsTrigger>
                    <TabsTrigger value="entered">Entered Cars</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    type="date" 
                    id="startDate" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    type="date" 
                    id="endDate" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                
                <div className="flex items-end space-x-2">
                  <Button onClick={handleApplyFilter} className="gap-1">
                    <Filter className="h-4 w-4" />
                    Apply Filter
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant={reportType === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportType('daily')}
                  className={reportType === 'daily' ? 'bg-teal-500 hover:bg-teal-600' : ''}
                >
                  Today
                </Button>
                <Button
                  variant={reportType === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportType('monthly')}
                  className={reportType === 'monthly' ? 'bg-teal-500 hover:bg-teal-600' : ''}
                >
                  This Month
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
            
            {currentReport.records.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <th className="text-left py-3 px-6 font-medium text-slate-500">Plate Number</th>
                        <th className="text-left py-3 px-6 font-medium text-slate-500">Parking Lot</th>
                        <th className="text-left py-3 px-6 font-medium text-slate-500">Entry Time</th>
                        <th className="text-left py-3 px-6 font-medium text-slate-500">Exit Time</th>
                        <th className="text-left py-3 px-6 font-medium text-slate-500">Duration</th>
                        <th className="text-right py-3 px-6 font-medium text-slate-500">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReport.records.map((record) => (
                        <tr key={record.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="py-3 px-6 font-medium">{record.plateNumber}</td>
                          <td className="py-3 px-6">{record.parkingLotName}</td>
                          <td className="py-3 px-6 text-slate-500">{formatDate(record.entryTime)}</td>
                          <td className="py-3 px-6 text-slate-500">
                            {record.exitTime !== 'N/A' ? formatDate(record.exitTime) : 'N/A'}
                          </td>
                          <td className="py-3 px-6">{record.duration} hrs</td>
                          <td className="py-3 px-6 text-right font-medium">${record.fee.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {currentReport.pagination && currentReport.pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4 px-6 py-3 border-t border-slate-200">
                    <div className="text-sm text-slate-500">
                      Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, currentReport.pagination.total)} of {currentReport.pagination.total} entries
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!currentReport.pagination || currentPage >= currentReport.pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-slate-800 font-medium mb-1">No transactions found</h3>
                <p className="text-slate-500 text-sm">There are no transactions for the selected period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder for chart */}
              <div className="bg-slate-50 rounded-lg h-[250px] flex items-center justify-center">
                <p className="text-slate-400 text-sm">Revenue trend chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Top Performing Lots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => {
                  // Get data from monthly report if available, otherwise use placeholder
                  const lotData = outgoingReport.records[i] ? {
                    name: outgoingReport.records[i].parkingLotName,
                    fee: outgoingReport.records[i].fee
                  } : {
                    name: `Parking Lot ${i+1}`,
                    fee: 0
                  };
                  
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center">
                        <div className={`w-2 h-10 rounded-full mr-3 ${
                          i === 0 ? 'bg-teal-500' : i === 1 ? 'bg-indigo-500' : 'bg-orange-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">{lotData.name}</p>
                          <p className="text-xs text-slate-500">Active</p>
                        </div>
                      </div>
                      <p className="font-medium">${lotData.fee.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernDashboardLayout>
  );
};

export default Reports;
