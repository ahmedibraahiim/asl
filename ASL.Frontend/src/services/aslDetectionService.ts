/**
 * ASL Detection Service
 * Connects to the ASL Recognition API
 */

const ASL_API_URL = 'http://localhost:8000';

export interface ASLDetectionResponse {
  sign: string;
  confidence: number;
  landmarks: Array<{
    x: number;
    y: number;
    z: number;
    index: number;
  }>;
  has_hand: boolean;
}

export const predictFromBase64 = async (base64Image: string): Promise<ASLDetectionResponse> => {
  try {
    console.log('Sending base64 image to API...');
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    // Log the first 50 characters of the base64 string to verify it's valid
    console.log('Base64 data sample:', base64Data.substring(0, 50) + '...');
    
    const response = await fetch(`${ASL_API_URL}/predict/base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
    });
    
    if (!response.ok) {
      console.error('API returned error status:', response.status);
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API response:', result);
    return result;
  } catch (error) {
    console.error('Error during ASL detection:', error);
    throw error;
  }
};

export const testAPIConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing API connection...');
    const response = await fetch(`${ASL_API_URL}/health`);
    const data = await response.json();
    console.log('API health check successful:', data);
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

export const checkAPIHealth = async (): Promise<{ status: string; model_loaded: boolean }> => {
  try {
    console.log('Checking API health...');
    const response = await fetch(`${ASL_API_URL}/health`);
    
    if (!response.ok) {
      console.error('Health check failed with status:', response.status);
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Health check result:', result);
    return result;
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
}; 