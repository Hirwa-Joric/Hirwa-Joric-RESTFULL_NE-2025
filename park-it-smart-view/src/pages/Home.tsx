import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BarChart2, Clock, ParkingCircle, Shield } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  
  const getDashboardLink = () => {
    if (!isAuthenticated) return '/login';
    return user?.role === 'Admin' ? '/admin/dashboard' : '/attendant/dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">ParkWise</span>
            <span className="bg-blue-600 text-white px-1.5 py-0.5 text-xs rounded">XWZ</span>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-800 font-medium hover:text-blue-600 transition-colors">Home</Link>
            <Link to="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
            <Link to="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
            <Link to="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                asChild
              >
                <Link to={getDashboardLink()}>
                  Dashboard <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 font-medium hover:text-blue-600 transition-colors">
                  Sign in
                </Link>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700" 
                  asChild
                >
                  <Link to="/signup">
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-12 md:mb-0">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  Next-Gen Parking Management Solution
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Streamline operations, maximize revenue, and deliver exceptional 
                  customer experiences with ParkWise XWZ parking management system.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-lg py-6 px-8" 
                    asChild
                  >
                    <Link to={getDashboardLink()}>
                      {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 text-lg py-6 px-8" 
                    asChild
                  >
                    <Link to="/signup">
                      Learn More
                    </Link>
                  </Button>
                </div>
                
                <div className="flex items-center space-x-8 mt-12">
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden">
                          <span className="text-xs font-medium text-gray-600">{i}</span>
                        </div>
                      ))}
                    </div>
                    <span className="ml-3 text-sm text-gray-500">Trusted by 1,000+ companies</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">5.0 (2.5k+ reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/2 md:pl-12">
                <div className="relative">
                  <div className="bg-blue-600 rounded-xl p-2 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="bg-white rounded-lg overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                        alt="Dashboard Preview" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                  
                  <div className="absolute -right-4 -bottom-4 bg-white rounded-lg p-4 shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <BarChart2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">24% Increase</p>
                        <p className="text-xs text-gray-500">in monthly revenue</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background elements */}
          <div className="absolute top-20 left-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-8 right-0 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to manage your parking facilities efficiently and effectively
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 mb-5 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <ParkingCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Real-time Monitoring</h3>
                  <p className="text-gray-600">
                    Monitor parking space availability across all your facilities in real-time with our intuitive dashboard.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 mb-5 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <Clock className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Automated Billing</h3>
                  <p className="text-gray-600">
                    Calculate fees automatically based on parking duration and generate receipts for seamless customer service.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 mb-5 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <Shield className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Comprehensive Reports</h3>
                  <p className="text-gray-600">
                    Generate detailed reports on parking usage, revenue trends, and occupancy rates to optimize your operations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
      </main>
      
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-xl font-bold mr-2">ParkWise</span>
                <span className="bg-blue-600 px-1.5 py-0.5 text-xs rounded">XWZ</span>
              </div>
              <p className="text-gray-400 mb-4">
                Modern parking management solution for intelligent operations
              </p>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'instagram', 'linkedin'].map(platform => (
                  <a key={platform} href="#" className="text-gray-400 hover:text-white">
                    <span className="sr-only">{platform}</span>
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      <span>{platform[0].toUpperCase()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            


          </div>
          
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} ParkWise XWZ • All rights reserved
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
