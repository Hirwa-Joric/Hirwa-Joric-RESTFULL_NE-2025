import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parkingLotsService } from '../../services/api';
import ModernDashboardLayout from '../../components/layout/ModernDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from "sonner";
import logger from '@/utils/logger';

const AddParkingLot = () => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    total_spaces: '',
    location: '',
    fee_per_hour: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericTotalSpaces = parseInt(formData.total_spaces);
    const numericChargingFee = parseFloat(formData.fee_per_hour);
    
    // Validation
    if (!formData.code || !formData.name || !formData.location) {
      toast.error("All fields are required");
      return;
    }
    
    if (isNaN(numericTotalSpaces) || numericTotalSpaces <= 0) {
      toast.error("Total spaces must be a positive number");
      return;
    }
    
    if (isNaN(numericChargingFee) || numericChargingFee <= 0) {
      toast.error("Charging fee must be a positive number");
      return;
    }
    
    try {
      setIsSubmitting(true);
      logger.debug('Submitting parking lot data:', formData);
      
      // Convert frontend field names to backend field names
      const parkingLotData = {
        code: formData.code,
        name: formData.name,
        total_spaces: numericTotalSpaces,
        location: formData.location,
        fee_per_hour: numericChargingFee
      };
      
      logger.debug('Mapped parking lot data for API:', parkingLotData);
      
      await parkingLotsService.create(parkingLotData);
      toast.success("Parking lot created successfully");
      navigate('/parking-lots');
    } catch (error) {
      console.error('Error creating parking lot:', error);
      toast.error("Failed to create parking lot. Please check your input and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModernDashboardLayout 
      title="Add New Parking Lot" 
      subtitle="Create a new parking area in the system"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-md border-0">
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="code">Parking Lot Code</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="e.g., NORTH-01"
                    value={formData.code}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Parking Lot Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., North Tower Parking"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., 123 Main St, North Building"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="total_spaces">Total Parking Spaces</Label>
                  <Input
                    id="total_spaces"
                    name="total_spaces"
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    value={formData.total_spaces}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fee_per_hour">Hourly Rate ($)</Label>
                  <Input
                    id="fee_per_hour"
                    name="fee_per_hour"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g., 5.00"
                    value={formData.fee_per_hour}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t p-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/parking-lots')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-teal-500 hover:bg-teal-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Parking Lot'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ModernDashboardLayout>
  );
};

export default AddParkingLot;
