import { useState, useEffect } from 'react';
import { fetchDictionary, ASLLetter } from '../../services';
import './DictionaryPage.css';

const DictionaryPage = () => {
  const [letters, setLetters] = useState<ASLLetter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<ASLLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  const letterGroups = [
    { id: 'all', label: 'All' },
    { id: 'a-f', label: 'A-F' },
    { id: 'g-k', label: 'G-K' },
    { id: 'l-p', label: 'L-P' },
    { id: 'q-u', label: 'Q-U' },
    { id: 'v-z', label: 'V-Z' }
  ];

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

  const handleSelectLetter = (letter: string) => {
    const found = letters.find(l => l.letter === letter);
    if (found) {
      setSelectedLetter(found);
    }
  };

  const filterLetters = (filter: string) => {
    setActiveFilter(filter);
  };

  const getFilteredAlphabet = () => {
    switch (activeFilter) {
      case 'a-f':
        return alphabet.slice(0, 6); // A-F
      case 'g-k':
        return alphabet.slice(6, 11); // G-K
      case 'l-p':
        return alphabet.slice(11, 16); // L-P
      case 'q-u':
        return alphabet.slice(16, 21); // Q-U
      case 'v-z':
        return alphabet.slice(21); // V-Z
      default:
        return alphabet;
    }
  };

  const isLetterAvailable = (letter: string) => {
    return letters.some(l => l.letter === letter);
  };

  return (
    <div className="dictionary-page">
      <h1>ASL Dictionary</h1>
      
      <div className="filter-container">
        {letterGroups.map(group => (
          <button
            key={group.id}
            className={`filter-button ${activeFilter === group.id ? 'active' : ''}`}
            onClick={() => filterLetters(group.id)}
          >
            {group.label}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Loading dictionary...</span>
        </div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="dictionary-layout">
          <div className="alphabet-grid">
            {getFilteredAlphabet().map(letter => (
              <div 
                key={letter}
                className={`letter-tile ${selectedLetter?.letter === letter ? 'active' : ''} ${!isLetterAvailable(letter) ? 'disabled' : ''}`}
                onClick={() => isLetterAvailable(letter) && handleSelectLetter(letter)}
              >
                {letter}
              </div>
            ))}
          </div>
          
          {selectedLetter && (
            <div className="letter-details-card">
              <h2>Letter {selectedLetter.letter}</h2>
              
              <div className="letter-display">
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
                    preload="metadata"
                  />
                  <p className="caption">How to sign letter {selectedLetter.letter}</p>
                </div>
              </div>
              
              <div className="letter-info-section">
                <div className="info-block hand-position">
                  <div className="info-header">
                    <h3>Hand Position</h3>
                  </div>
                  <p>{selectedLetter.handshapeDescription}</p>
                </div>
              </div>
              
              <div className="letter-info-section">
                <div className="info-block example-word">
                  <div className="info-header">
                    <h3>Example Word: {selectedLetter.exampleWord}</h3>
                  </div>
                  <div className="example-video-wrapper">
                    <video 
                      src={selectedLetter.wordASLVideo}
                      controls
                      className="word-video"
                      preload="metadata"
                    />
                  </div>
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