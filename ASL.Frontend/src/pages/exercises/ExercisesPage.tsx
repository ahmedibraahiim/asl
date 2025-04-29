import React from 'react';
import { Link } from 'react-router-dom';
import './exercises.css';

// Import images for each section
import AhandImg from '../../assets/asl_alphabets/Ahand.svg';
import GhandImg from '../../assets/asl_alphabets/Ghand.svg';
import LhandImg from '../../assets/asl_alphabets/Lhand.svg';
import QhandImg from '../../assets/asl_alphabets/Qhand.svg';
import VhandImg from '../../assets/asl_alphabets/Vhand.svg';

const ExercisesPage = () => {
  const exerciseSections = [
    {
      id: 'a-f',
      title: 'A-F',
      image: AhandImg,
      description: 'Practice American Sign Language alphabet letters A through F.',
      letters: ['A', 'B', 'C', 'D', 'E', 'F']
    },
    {
      id: 'g-k',
      title: 'G-K',
      image: GhandImg,
      description: 'Practice American Sign Language alphabet letters G through K.',
      letters: ['G', 'H', 'I', 'J', 'K']
    },
    {
      id: 'l-p',
      title: 'L-P',
      image: LhandImg,
      description: 'Practice American Sign Language alphabet letters L through P.',
      letters: ['L', 'M', 'N', 'O', 'P']
    },
    {
      id: 'q-u',
      title: 'Q-U',
      image: QhandImg,
      description: 'Practice American Sign Language alphabet letters Q through U.',
      letters: ['Q', 'R', 'S', 'T', 'U']
    },
    {
      id: 'v-z',
      title: 'V-Z',
      image: VhandImg,
      description: 'Practice American Sign Language alphabet letters V through Z.',
      letters: ['V', 'W', 'X', 'Y', 'Z']
    }
  ];

  return (
    <div className="exercises-page">
      <div className="page-header">
        <h1>ASL Exercises</h1>
        <p className="description">
          Choose an exercise section to practice American Sign Language alphabet letters. 
          Each section will help you learn to sign different groups of letters.
        </p>
      </div>

      <div className="exercise-sections">
        {exerciseSections.map((section) => (
          <div key={section.id} className="exercise-section-card">
            <div className="section-image">
              <img src={section.image} alt={`${section.title} exercise`} />
            </div>
            <div className="section-content">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              <div className="letter-preview">
                {section.letters.map(letter => (
                  <span key={letter} className="preview-letter">{letter}</span>
                ))}
              </div>
              <Link to={`/exercises/${section.id}`} className="start-button">
                Start Practice
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExercisesPage; 