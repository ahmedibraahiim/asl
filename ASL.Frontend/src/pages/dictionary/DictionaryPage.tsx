import { useState, useEffect } from 'react';
import { fetchDictionary, ASLLetter } from '../../services';
import './DictionaryPage.css';

const DictionaryPage = () => {
  const [letters, setLetters] = useState<ASLLetter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<ASLLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);

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
          setShowDetails(false);
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

  const handleSelectLetter = (letter: ASLLetter) => {
    setSelectedLetter(letter);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
  };

  const filterLetters = (filter: string) => {
    setActiveFilter(filter);
    setShowDetails(false);
  };

  const getFilteredLetters = () => {
    switch (activeFilter) {
      case 'a-f':
        return letters.filter(letter => letter.letter >= 'A' && letter.letter <= 'F');
      case 'g-k':
        return letters.filter(letter => letter.letter >= 'G' && letter.letter <= 'K');
      case 'l-p':
        return letters.filter(letter => letter.letter >= 'L' && letter.letter <= 'P');
      case 'q-u':
        return letters.filter(letter => letter.letter >= 'Q' && letter.letter <= 'U');
      case 'v-z':
        return letters.filter(letter => letter.letter >= 'V' && letter.letter <= 'Z');
      default:
        return letters;
    }
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
        <>
          <div className="letter-cards-grid">
            {getFilteredLetters().map(letter => (
              <div 
                key={letter.letter}
                className="letter-card"
                onClick={() => handleSelectLetter(letter)}
              >
                <div className="letter-card-content">
                  <h3 className="letter-title">{letter.letter}</h3>
                  <div className="letter-card-image">
                    <img 
                      src={letter.imageUrl}
                      alt={`ASL Letter ${letter.letter}`}
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedLetter && showDetails && (
            <div className="letter-detail-overlay">
              <div className="letter-detail-modal">
                <button className="close-button" onClick={closeDetails}>×</button>
                
                <div className="letter-detail-header">
                  <h2>Letter {selectedLetter.letter}</h2>
                </div>
                
                <div className="letter-detail-content">
                  <div className="detail-section">
                    <div className="detail-media">
                      <div className="detail-image">
                        <img 
                          src={selectedLetter.imageUrl}
                          alt={`ASL Letter ${selectedLetter.letter}`}
                        />
                      </div>
                      
                      <div className="detail-video">
                        <video 
                          src={selectedLetter.videoUrl}
                          controls
                          poster={selectedLetter.imageUrl}
                          preload="metadata"
                        />
                        <p className="caption">How to sign letter {selectedLetter.letter}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h3>Hand Position</h3>
                    <p>{selectedLetter.handshapeDescription}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h3>Example Word: {selectedLetter.exampleWord}</h3>
                    <div className="example-video">
                      <video 
                        src={selectedLetter.wordASLVideo}
                        controls
                        preload="metadata"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DictionaryPage; 