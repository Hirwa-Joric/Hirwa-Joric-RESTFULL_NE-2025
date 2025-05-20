
import { ReactNode } from 'react';
import Header from './Header';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6 md:py-8">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>
            <div className="h-1 w-20 bg-parking-blue mt-2 rounded-full"></div>
          </div>
        )}
        
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ParkWise XWZ System • All rights reserved
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
