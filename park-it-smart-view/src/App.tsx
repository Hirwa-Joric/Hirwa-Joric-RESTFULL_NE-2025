
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AttendantDashboard from "./pages/dashboard/AttendantDashboard";
import ParkingLots from "./pages/parking/ParkingLots";
import AddParkingLot from "./pages/parking/AddParkingLot";
import ParkingOperations from "./pages/parking/ParkingOperations";
import Reports from "./pages/reports/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes - All authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/parking-lots" element={<ParkingLots />} />
            </Route>
            
            {/* Protected Routes - Admin Only */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/parking-lots/new" element={<AddParkingLot />} />
              <Route path="/admin/reports" element={<Reports />} />
            </Route>
            
            {/* Protected Routes - Attendant & Admin */}
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Attendant']} />}>
              <Route path="/attendant/dashboard" element={<AttendantDashboard />} />
              <Route path="/attendant/operations" element={<ParkingOperations />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
