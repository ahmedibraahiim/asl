export * from './dictionaryService';
export * from './apiService';

// Explicitly re-export ASL detection service with specific names
import { 
  predictFromBase64 as aslPredictFromBase64,
  testAPIConnection as aslTestAPIConnection,
  checkAPIHealth as aslCheckAPIHealth
} from './aslDetectionService';

// Explicitly re-export A-to-F service with specific names
import { 
  predictFromBase64 as aToFPredictFromBase64,
  testAPIConnection as aToFTestAPIConnection,
  checkAPIHealth as aToFCheckAPIHealth
} from './aToFApiService';

// Re-export with new names
export {
  aslPredictFromBase64,
  aslTestAPIConnection,
  aslCheckAPIHealth,
  aToFPredictFromBase64,
  aToFTestAPIConnection,
  aToFCheckAPIHealth
}; 