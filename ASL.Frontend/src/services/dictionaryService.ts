export interface ASLLetter {
  letter: string;
  imageUrl: string;
  videoUrl: string;
  handshapeDescription: string;
  exampleWord: string;
  wordASLVideo: string;
}

export interface DictionaryResponse {
  success: boolean;
  message: string;
  data: ASLLetter[];
  errors: string[] | null;
}

/**
 * Fetches ASL alphabet data from the API
 * @param search - Search term for filtering results
 * @param exactMatch - If true, returns exact match for the letter, if false returns all letters
 * @returns Promise with dictionary data
 */
export const fetchDictionary = async (search: string = '', exactMatch: boolean = false): Promise<DictionaryResponse> => {
  try {
    const url = `http://localhost:5156/api/ASLAlphabet?search=${encodeURIComponent(search)}&exactMatch=${exactMatch}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data: DictionaryResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dictionary data:', error);
    return {
      success: false,
      message: 'Failed to fetch dictionary data',
      data: [],
      errors: [(error as Error).message]
    };
  }
}; 