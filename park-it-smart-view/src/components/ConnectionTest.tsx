import React, { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import logger from '../utils/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ConnectionStatus {
  isConnected: boolean;
  message: string;
  isLoading: boolean;
  details?: string;
  data?: any;
}

const ConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing connection...');
  const [apiResponse, setApiResponse] = useState<string>('');
  
  const testConnection = async () => {
    setStatus('Testing connection...');
    try {
      const response = await apiClient.get('/');
      setStatus('Connection successful');
      setApiResponse(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.error('Connection test error:', error);
      setStatus(`Connection failed: ${error.message}`);
      
      if (error.response) {
        setApiResponse(JSON.stringify({
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        }, null, 2));
      } else {
        setApiResponse('No response data available');
      }
    }
  };
  
  useEffect(() => {
    testConnection();
  }, []);
  
  return (
    <div className="p-4 border border-gray-200 rounded-md mb-6">
      <h3 className="text-lg font-medium mb-2">API Connection Test</h3>
      <div className="mb-2">
        <span className="font-medium">Status: </span>
        <span className={`${status.includes('failed') ? 'text-red-600' : status.includes('successful') ? 'text-green-600' : 'text-gray-600'}`}>
          {status}
        </span>
      </div>
      <div className="mb-4">
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-32">
          {apiResponse || 'No response yet'}
        </pre>
      </div>
      <Button size="sm" onClick={testConnection}>
        Test Again
      </Button>
    </div>
  );
};

export default ConnectionTest; 