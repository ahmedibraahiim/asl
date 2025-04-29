/**
 * A-to-F ASL Detection Service
 * Connects to the specialized A-to-F Recognition API
 */

const A_TO_F_API_URL = 'http://localhost:8001';

export interface AToFDetectionResponse {
  sign: string;
  confidence: number;
  landmarks: Array<{
    x: number;
    y: number;
    z: number;
    index: number;
  }>;
  has_hand: boolean;
  is_a_to_f: boolean;
}

export const predictFromBase64 = async (base64Image: string): Promise<AToFDetectionResponse> => {
  try {
    console.log('Sending detection request to A-to-F API:', A_TO_F_API_URL + '/predict/base64');
    
    const response = await fetch(`${A_TO_F_API_URL}/predict/base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });
    
    if (!response.ok) {
      console.error('A-to-F API returned error status:', response.status);
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API response:', result);
    return result;
  } catch (error) {
    console.error('Error during A-to-F detection:', error);
    throw error;
  }
};

export const testAPIConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing A-to-F API connection...');
    const response = await fetch(`${A_TO_F_API_URL}/health`);
    const data = await response.json();
    console.log('A-to-F API health check successful:', data);
    return true;
  } catch (error) {
    console.error('A-to-F API connection test failed:', error);
    return false;
  }
};

export const checkAPIHealth = async (): Promise<{ status: string; model_loaded: boolean }> => {
  try {
    console.log('Checking A-to-F API health...');
    const response = await fetch(`${A_TO_F_API_URL}/health`);
    
    if (!response.ok) {
      console.error('A-to-F Health check failed with status:', response.status);
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('A-to-F Health check result:', result);
    return result;
  } catch (error) {
    console.error('Error checking A-to-F API health:', error);
    throw error;
  }
}; 