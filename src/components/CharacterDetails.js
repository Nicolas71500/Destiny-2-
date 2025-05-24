import React from "react";

const CharacterDetails = ({ character, characterDetails, platformName }) => {
  if (!character || !characterDetails) {
    return (
      <div className="character-details-loading">
        <p>Sélectionnez un personnage pour voir ses détails</p>
      </div>
    );
  }

  const getEquippedItems = () => {
    const equipment = characterDetails.equipment?.data?.items || [];
    const categories = {
      weapons: [],
      armor: [],
      other: [],
    };

    equipment.forEach((item) => {
      // Simplification : on catégorise par slot
      if ([1498876634, 2465295065, 953998645].includes(item.bucketHash)) {
        categories.weapons.push(item);
      } else if (
        [3448274439, 3551918588, 14239492, 20886954, 1585787867].includes(
          item.bucketHash
        )
      ) {
        categories.armor.push(item);
      } else {
        categories.other.push(item);
      }
    });

    return categories;
  };

  const getInventoryExotics = () => {
    const inventory = characterDetails.inventory?.data?.items || [];
    return inventory.filter((item) => {
      // Logique pour identifier les exotiques (à adapter selon vos données)
      return item.itemHash && item.itemHash.toString().length > 8;
    });
  };

  const equippedItems = getEquippedItems();
  const inventoryExotics = getInventoryExotics();

  return (
    <div className="character-details">
      <div className="character-header">
        <div
          className="character-banner"
          style={{
            backgroundImage: character.emblemBackgroundPath
              ? `url(https://www.bungie.net${character.emblemBackgroundPath})`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <div className="character-title">
            <h2>{character.className}</h2>
            <p>
              Niveau {character.level} • ⚡ {character.light} • {platformName}
            </p>
          </div>
        </div>
      </div>

      <div className="character-content">
        <div className="equipment-section">
          <h3>Équipement actuel</h3>

          <div className="equipment-category">
            <h4>🔫 Armes ({equippedItems.weapons.length})</h4>
            <div className="items-grid">
              {equippedItems.weapons.map((item) => (
                <div
                  key={item.itemInstanceId || item.itemHash}
                  className="item-slot weapon"
                >
                  <div className="item-placeholder">Hash: {item.itemHash}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="equipment-category">
            <h4>🛡️ Armure ({equippedItems.armor.length})</h4>
            <div className="items-grid">
              {equippedItems.armor.map((item) => (
                <div
                  key={item.itemInstanceId || item.itemHash}
                  className="item-slot armor"
                >
                  <div className="item-placeholder">Hash: {item.itemHash}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="inventory-section">
          <h3>Inventaire</h3>
          <div className="inventory-stats">
            <p>Objets exotiques potentiels : {inventoryExotics.length}</p>
          </div>

          {inventoryExotics.length > 0 && (
            <div className="exotic-items">
              <h4>🌟 Items d'intérêt</h4>
              <div className="items-grid">
                {inventoryExotics.slice(0, 12).map((item) => (
                  <div
                    key={item.itemInstanceId || item.itemHash}
                    className="item-slot exotic"
                  >
                    <div className="item-placeholder">{item.itemHash}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="character-stats-section">
          <h3>Statistiques</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Temps de jeu total</span>
              <span className="stat-value">
                {Math.floor(character.minutesPlayedTotal / 60)}h
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Niveau de puissance</span>
              <span className="stat-value">{character.light}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Dernière connexion</span>
              <span className="stat-value">
                {character.lastPlayed.toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetails;
