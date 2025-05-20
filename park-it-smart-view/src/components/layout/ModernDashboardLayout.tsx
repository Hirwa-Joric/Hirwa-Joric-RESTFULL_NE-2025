import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Car, 
  BarChart3, 
  Settings, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Bell, 
  Search,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';

interface ModernDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const ModernDashboardLayout = ({ children, title, subtitle }: ModernDashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  // Create navigation items based on user role
  const navigationItems = [
    { name: 'Dashboard', 
      icon: LayoutDashboard, 
      path: user?.role === 'Admin' ? '/admin/dashboard' : '/attendant/dashboard' 
    },
    { name: 'Parking Lots', 
      icon: Car, 
      path: '/parking-lots' 
    },
    ...(user?.role === 'Admin' || user?.role === 'Attendant' 
      ? [{ 
          name: 'Operations', 
          icon: Car, 
          path: '/attendant/operations' 
        }] 
      : []
    ),
    ...(user?.role === 'Admin' 
      ? [{ 
          name: 'Reports', 
          icon: BarChart3, 
          path: '/admin/reports' 
        }] 
      : []
    )
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-700 text-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header with Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-600">
          <div className="flex items-center space-x-2">
            <div className="font-bold text-xl">ParkWise</div>
            <span className="bg-teal-500 text-white px-1.5 py-0.5 text-xs rounded">XWZ</span>
          </div>
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="text-white hover:bg-slate-600">
              <X size={18} />
            </Button>
          )}
        </div>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-b border-slate-600">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                <User size={20} />
              </div>
              <div>
                <div className="font-medium">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-slate-400">{user.role}</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-2 overflow-y-auto">
          <div className="mb-2 px-3 pt-3 pb-1">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</h3>
          </div>
          
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg mb-1 text-sm transition-colors",
                  isActive 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-300 hover:bg-slate-600 hover:text-white"
                )}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-600">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-600"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 flex items-center h-16 px-4 md:px-6 sticky top-0 z-10">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSidebar} 
            className="md:hidden mr-2"
          >
            <Menu size={20} />
          </Button>
          
          <div className="flex-1 flex justify-between items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search something..." 
                className="pl-9 py-1.5 h-9 bg-slate-50 border-slate-200 rounded-lg w-full max-w-md"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="text-slate-500 relative">
                <Bell size={18} />
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="hidden md:flex border-teal-500 text-teal-500 hover:bg-teal-50"
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {/* Page Title */}
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
              {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
            </div>
          )}
          
          {/* Children Content */}
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModernDashboardLayout;
