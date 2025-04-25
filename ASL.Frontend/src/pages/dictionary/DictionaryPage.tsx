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
  const [animateCard, setAnimateCard] = useState<string | null>(null);

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
    setAnimateCard(letter.letter);
    setTimeout(() => {
      setSelectedLetter(letter);
      setShowDetails(true);
      setAnimateCard(null);
    }, 300);
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
    <div className="dictionary-page-container">
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
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        ) : (
          <div className="dictionary-content">
            <div className="letter-cards-grid">
              {getFilteredLetters().map(letter => (
                <div 
                  key={letter.letter}
                  className={`letter-card ${animateCard === letter.letter ? 'animate-selection' : ''}`}
                  onClick={() => handleSelectLetter(letter)}
                  style={{
                    animationDelay: `${(letter.letter.charCodeAt(0) - 65) * 0.05}s`
                  }}
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
            
            {getFilteredLetters().length === 0 && (
              <div className="no-results">
                <p>No letters found in this range.</p>
                <button className="reset-button" onClick={() => filterLetters('all')}>
                  Show All Letters
                </button>
              </div>
            )}
          </div>
        )}
        
        {selectedLetter && showDetails && (
          <div className="letter-detail-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) closeDetails();
          }}>
            <div className="letter-detail-modal">
              <button className="close-button" onClick={closeDetails}>×</button>
              
              <div className="letter-detail-header">
                <h2>Letter {selectedLetter.letter}</h2>
              </div>
              
              <div className="letter-detail-content">
                <div className="detail-section">
                  <h3>Visual Reference</h3>
                  <div className="detail-media">
                    <div className="detail-image">
                      <img 
                        src={selectedLetter.imageUrl}
                        alt={`ASL Letter ${selectedLetter.letter}`}
                      />
                      <p className="caption">Static Hand Position</p>
                    </div>
                    
                    <div className="detail-video">
                      <video 
                        src={selectedLetter.videoUrl}
                        controls
                        poster={selectedLetter.imageUrl}
                        preload="metadata"
                        autoPlay
                        loop
                        muted
                      />
                      <p className="caption">Motion Demonstration</p>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Hand Position Guide</h3>
                  <p>{selectedLetter.handshapeDescription}</p>
                  <div className="tips">
                    <div className="tip-item">
                      <span className="tip-icon">💡</span>
                      <span className="tip-text">Practice with a mirror to check your hand shape</span>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">👋</span>
                      <span className="tip-text">Pay attention to finger positioning and orientation</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Example Word: <span className="highlight-word">{selectedLetter.exampleWord}</span></h3>
                  <p className="word-description">
                    This example demonstrates how the letter {selectedLetter.letter} is used in 
                    fingerspelling the word "{selectedLetter.exampleWord}".
                  </p>
                  <div className="example-video">
                    <video 
                      src={selectedLetter.wordASLVideo}
                      controls
                      preload="metadata"
                      autoPlay
                      muted
                    />
                  </div>
                  <div className="practice-prompt">
                    <span className="practice-icon">✨</span>
                    <span>Try spelling this word yourself to practice!</span>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Common Mistakes</h3>
                  <div className="mistakes-list">
                    <div className="mistake-item">
                      <span className="mistake-icon">⚠️</span>
                      <div className="mistake-content">
                        <h4>Palm Orientation</h4>
                        <p>Make sure your palm is facing the correct direction.</p>
                      </div>
                    </div>
                    <div className="mistake-item">
                      <span className="mistake-icon">⚠️</span>
                      <div className="mistake-content">
                        <h4>Finger Position</h4>
                        <p>Pay attention to which fingers should be extended vs. bent.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPage; 