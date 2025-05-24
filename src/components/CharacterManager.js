import React from "react";
import { useBungieAuth } from "../hooks/useBungieAuth";
import CharacterSelector from "./CharacterSelector";
import CharacterDetails from "./CharacterDetails";

const CharacterManager = () => {
  const {
    user,
    platforms,
    selectedPlatform,
    characters,
    selectedCharacter,
    characterDetails,
    loading,
    error,
    isAuthenticated,
    handlePlatformSelect,
    handleCharacterSelect,
  } = useBungieAuth();

  if (!isAuthenticated) {
    return (
      <div className="character-manager-unauthorized">
        <h2>Connexion requise</h2>
        <p>
          Veuillez vous connecter avec votre compte Bungie pour accéder à vos
          personnages.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="character-manager-loading">
        <h2>Chargement de vos données Destiny 2...</h2>
        <div className="spinner">⏳</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="character-manager-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="character-manager">
      <div className="character-manager-header">
        <h1>Vos Gardiens Destiny 2</h1>
      </div>

      <div className="character-manager-content">
        <div className="selection-panel">
          {selectedPlatform && characters && characters.length > 0 && (
            <div>
              <CharacterSelector
                characters={characters}
                selectedCharacter={selectedCharacter}
                onCharacterSelect={handleCharacterSelect}
              />
            </div>
          )}
        </div>

        {selectedCharacter && (
          <div className="details-panel">
            {/* Affiche un loader si le personnage est sélectionné mais les détails ne sont pas encore chargés */}
            {!characterDetails ? (
              <div className="character-details-loading">
                <h3>Chargement des détails du personnage...</h3>
                <div className="spinner">⏳</div>
              </div>
            ) : (
              <CharacterDetails
                character={selectedCharacter}
                characterDetails={characterDetails}
                platformName={selectedPlatform?.platformName}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterManager;
