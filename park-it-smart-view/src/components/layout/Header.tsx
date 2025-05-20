
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-2xl font-bold text-parking-blue">
            ParkWise
          </Link>
          <span className="bg-parking-blue text-white px-1.5 py-0.5 text-xs rounded">XWZ</span>
        </div>

        <nav className="hidden md:flex space-x-6">
          {isAuthenticated ? (
            <>
              <Link to="/parking-lots" className="text-gray-600 hover:text-parking-blue transition-colors">
                Parking Lots
              </Link>
              
              {user?.role === 'Admin' && (
                <>
                  <Link to="/admin/dashboard" className="text-gray-600 hover:text-parking-blue transition-colors">
                    Admin Dashboard
                  </Link>
                  <Link to="/admin/reports" className="text-gray-600 hover:text-parking-blue transition-colors">
                    Reports
                  </Link>
                </>
              )}
              
              {(user?.role === 'Admin' || user?.role === 'Attendant') && (
                <Link to="/attendant/operations" className="text-gray-600 hover:text-parking-blue transition-colors">
                  Parking Operations
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-parking-blue transition-colors">
                Login
              </Link>
              <Link to="/signup" className="text-gray-600 hover:text-parking-blue transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {isAuthenticated && (
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">{`${user?.firstName} ${user?.lastName}`}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={logout}
              className="text-gray-700"
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
