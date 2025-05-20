import apiClient from './apiClient';

/**
 * Test function to check if the backend API is accessible
 */
export const testBackendConnection = async () => {
  try {
    // Try to connect to the backend root API
    // Since our apiClient is already configured with baseURL including '/api',
    // we need to go up one level to hit the server root
    const response = await apiClient.get('../');
    console.log('Backend connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Backend connection failed:', error);
    return { success: false, error };
  }
};

/**
 * Get API server status information (public endpoint)
 */
export const getApiStatus = async () => {
  try {
    // Use users endpoint as a test since it's part of the API
    const response = await apiClient.get('/users');
    return { success: true, data: response.data };
  } catch (error) {
    // If users endpoint fails (might require auth), try the root
    try {
      const rootResponse = await apiClient.get('');
      return { success: true, data: rootResponse.data };
    } catch (rootError) {
      console.error('Failed to get API status:', error);
      return { success: false, error };
    }
  }
};

export default { testBackendConnection, getApiStatus };