import React, { useState, useEffect } from 'react';
import { testBackendConnection, getApiStatus } from '../../services';

const ConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'loading' | 'success' | 'error';
    message: string;
  }>({
    status: 'loading',
    message: 'Testing connection to backend...'
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await testBackendConnection();
        if (result.success) {
          setConnectionStatus({
            status: 'success',
            message: 'Backend connected successfully!'
          });
        } else {
          setConnectionStatus({
            status: 'error',
            message: 'Failed to connect to backend. Please check if backend server is running.'
          });
        }
      } catch (error) {
        setConnectionStatus({
          status: 'error',
          message: 'Error testing backend connection.'
        });
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="rounded-md p-4 mb-6 border">
      <h3 className="text-lg font-semibold mb-2">Backend Connection Status</h3>
      <div className={`text-sm ${
        connectionStatus.status === 'success' ? 'text-green-500' :
        connectionStatus.status === 'error' ? 'text-red-500' :
        'text-amber-500'
      }`}>
        {connectionStatus.message}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        API URL: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
      </div>
    </div>
  );
};

export default ConnectionTest; 