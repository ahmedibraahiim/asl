import { useState, useEffect } from 'react';
import { fetchDictionary, ASLLetter } from '../../services';
import './DictionaryPage.css';

const DictionaryPage = () => {
  const [letters, setLetters] = useState<ASLLetter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<ASLLetter | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        setLoading(true);
        const response = await fetchDictionary('', false);
        
        if (response.success) {
          setLetters(response.data);
          if (response.data.length > 0) {
            setSelectedLetter(response.data[0]);
          }
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError('Failed to load dictionary data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDictionary();
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    try {
      setLoading(true);
      const response = await fetchDictionary(value, false);
      
      if (response.success) {
        setLetters(response.data);
        if (response.data.length > 0) {
          setSelectedLetter(response.data[0]);
        } else {
          setSelectedLetter(null);
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to search dictionary');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLetter = (letter: ASLLetter) => {
    setSelectedLetter(letter);
  };

  return (
    <div className="dictionary-page">
      <h1>ASL Dictionary</h1>
      
      <div className="dictionary-search">
        <input
          type="text"
          placeholder="Search for a letter..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="dictionary-content">
          <div className="letters-grid">
            {letters.map(letter => (
              <div 
                key={letter.letter}
                className={`letter-card ${selectedLetter?.letter === letter.letter ? 'selected' : ''}`}
                onClick={() => handleSelectLetter(letter)}
              >
                <div className="letter">{letter.letter}</div>
                <img 
                  src={letter.imageUrl}
                  alt={`ASL Letter ${letter.letter}`}
                  className="letter-image"
                />
              </div>
            ))}
          </div>
          
          {selectedLetter && (
            <div className="letter-details">
              <h2>Letter {selectedLetter.letter}</h2>
              
              <div className="letter-media">
                <div className="letter-image-container">
                  <img 
                    src={selectedLetter.imageUrl}
                    alt={`ASL Letter ${selectedLetter.letter}`}
                    className="letter-image-large"
                  />
                </div>
                
                <div className="letter-video-container">
                  <video 
                    src={selectedLetter.videoUrl}
                    controls
                    poster={selectedLetter.imageUrl}
                    className="letter-video"
                  />
                  <p className="caption">How to sign letter {selectedLetter.letter}</p>
                </div>
              </div>
              
              <div className="letter-info">
                <div className="handshape-description">
                  <h3>Hand Position:</h3>
                  <p>{selectedLetter.handshapeDescription}</p>
                </div>
                
                <div className="example-word">
                  <h3>Example Word: {selectedLetter.exampleWord}</h3>
                  <video 
                    src={selectedLetter.wordASLVideo}
                    controls
                    className="word-video"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DictionaryPage; 