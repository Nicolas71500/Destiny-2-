import React from "react";
import { useNavigate } from "react-router-dom";

const CharacterSelector = ({ characters, selectedCharacter, onCharacterSelect }) => {
  const navigate = useNavigate();

  console.log("🔍 CharacterSelector reçu:", characters?.length, "personnages");

  if (characters.length === 0) {
    return (
      <div className="no-characters">
        <h3>❌ Aucun personnage trouvé</h3>
        <p>Aucun personnage trouvé sur cette plateforme</p>
      </div>
    );
  }

  const handleCharacterClick = (character) => {
    console.log("🎯 Navigation vers personnage:", character.className);
    navigate(`/character/${character.id}`);
  };

  return (
    <div className="character-selector">
      <h3>🛡️ Mes Gardiens</h3>
      <div className="characters-grid">
        {characters.map((character, index) => (
          <div
            key={character.id}
            className="character-card"
            style={{ borderColor: getClassColor(character.className) }}
            onClick={() => handleCharacterClick(character)}
          >
            <div className="character-image-container">
              <div
                className="character-emblem-fallback"
                style={{
                  backgroundImage: character.emblemBackgroundPath
                    ? `url(https://www.bungie.net${character.emblemBackgroundPath})`
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <div className="character-overlay">
                  <div className="character-class">
                    <span className="class-icon">{getClassIcon(character.className)}</span>
                    <span className="class-name">{character.className}</span>
                  </div>
                  <div className="character-level">
                    <span className="level">Niv. {character.level}</span>
                    <span className="light">⚡ {character.light}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="character-info">
              <h4>{character.className} {character.raceTypeName}</h4>
              <div className="character-stats">
                <div className="stat-item">
                  <span className="stat-label">Niveau :</span>
                  <span className="stat-value">{character.level}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Lumière :</span>
                  <span className="stat-value">⚡ {character.light}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Temps de jeu :</span>
                  <span className="stat-value">{formatPlaytime(character.minutesPlayedTotal)}</span>
                </div>
              </div>
              
              <div className="character-action">
                <span className="view-equipment">👁️ Voir équipements</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Fonctions utilitaires
const getClassIcon = (className) => {
  const icons = {
    'Arcaniste': '⚡',
    'Chasseur': '🏹',
    'Titan': '🛡️'
  };
  return icons[className] || '🎮';
};

const getClassColor = (className) => {
  const colors = {
    'Arcaniste': '#9b59b6',
    'Chasseur': '#f39c12',
    'Titan': '#e74c3c'
  };
  return colors[className] || '#667eea';
};

const formatPlaytime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}j ${hours % 24}h`;
  }
  return `${hours}h`;
};

export default CharacterSelector;
