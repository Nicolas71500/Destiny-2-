import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBungieAuth } from "../hooks/useBungieAuth";

const CharacterDetail = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { characters, selectedPlatform } = useBungieAuth();
  const [characterEquipment, setCharacterEquipment] = useState(null);
  const [itemDetails, setItemDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSlot, setActiveSlot] = useState("weapons");

  // Trouve le personnage sélectionné
  const character = characters.find((char) => char.id === characterId);

  useEffect(() => {
    if (character && selectedPlatform) {
      loadCharacterEquipment();
    }
  }, [character, selectedPlatform]);

  const loadCharacterEquipment = async () => {
    try {
      setLoading(true);
      console.log("🔍 Chargement équipements pour:", character.className);

      // 1. Récupère les équipements
      const response = await fetch("https://127.0.0.1:3001/api/character-equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: localStorage.getItem("bungie_access_token"),
          membershipType: selectedPlatform.membershipType,
          membershipId: selectedPlatform.membershipId,
          characterId: characterId
        }),
      });

      if (response.ok) {
        const equipmentData = await response.json();
        console.log("🎮 Données équipements reçues:", equipmentData);
        setCharacterEquipment(equipmentData);

        // 2. Récupère tous les hashes d'items pour les détails
        const allItems = [];
        if (equipmentData.inventory?.data?.items) {
          allItems.push(...equipmentData.inventory.data.items);
        }
        if (equipmentData.equipment?.data?.items) {
          allItems.push(...equipmentData.equipment.data.items);
        }

        const uniqueHashes = [...new Set(allItems.map(item => item.itemHash))];
        console.log("📦 Hashes uniques à récupérer:", uniqueHashes.length, "items");

        // 3. Récupère TOUS les détails (supprime la limite)
        if (uniqueHashes.length > 0) {
          console.log("🔄 Récupération de TOUS les détails...");
          
          try {
            const detailsResponse = await fetch("https://127.0.0.1:3001/api/item-details", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemHashes: uniqueHashes }), // 🎯 SUPPRIME .slice(0, 5)
            });

            console.log("📊 Status détails:", detailsResponse.status);

            if (detailsResponse.ok) {
              const details = await detailsResponse.json();
              console.log("✨ Détails récupérés pour", Object.keys(details).length, "items sur", uniqueHashes.length, "demandés");
              
              setItemDetails(details);
            } else {
              console.error("❌ Erreur récupération détails");
              setItemDetails({});
            }
          } catch (detailError) {
            console.error("❌ Exception détails:", detailError);
            setItemDetails({});
          }
        }
      } else {
        console.error("❌ Erreur chargement équipements");
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSlotIcon = (slotType) => {
    const icons = {
      weapons: "⚔️",
      armor: "🛡️",
      ghost: "👻",
      ship: "🚀",
      sparrow: "🏍️",
      emblem: "🏷️",
    };
    return icons[slotType] || "📦";
  };

  const getRarityColor = (tierType) => {
    const colors = {
      2: "#1eac20", // Uncommon (Vert)
      3: "#5076a3", // Rare (Bleu)
      4: "#522f65", // Legendary (Violet)
      5: "#ceae33", // Exotic (Jaune)
      6: "#c3a019", // Exotic (Or)
    };
    return colors[tierType] || "#666";
  };

  const organizeEquipment = (equipmentData) => {
    if (!equipmentData) {
      return {
        weapons: [],
        armor: [],
        ghost: [],
        ship: [],
        sparrow: [],
        emblem: [],
      };
    }

    let allItems = [];
    if (equipmentData.inventory?.data?.items) {
      allItems = [...allItems, ...equipmentData.inventory.data.items];
    }
    if (equipmentData.equipment?.data?.items) {
      allItems = [...allItems, ...equipmentData.equipment.data.items];
    }

    const bucketHashes = {
      primaryWeapon: 1498876634,
      specialWeapon: 2465295065,
      heavyWeapon: 953998645,
      helmet: 3448274439,
      gauntlets: 3551918588,
      chestArmor: 14239492,
      legArmor: 20886954,
      classArmor: 1585787867,
      ghost: 4023194814,
      ship: 284967655,
      sparrow: 2025709351,
      emblem: 4274335291,
    };

    return {
      weapons: allItems.filter(
        (item) =>
          item.bucketHash === bucketHashes.primaryWeapon ||
          item.bucketHash === bucketHashes.specialWeapon ||
          item.bucketHash === bucketHashes.heavyWeapon
      ),
      armor: allItems.filter(
        (item) =>
          item.bucketHash === bucketHashes.helmet ||
          item.bucketHash === bucketHashes.gauntlets ||
          item.bucketHash === bucketHashes.chestArmor ||
          item.bucketHash === bucketHashes.legArmor ||
          item.bucketHash === bucketHashes.classArmor
      ),
      ghost: allItems.filter((item) => item.bucketHash === bucketHashes.ghost),
      ship: allItems.filter((item) => item.bucketHash === bucketHashes.ship),
      sparrow: allItems.filter(
        (item) => item.bucketHash === bucketHashes.sparrow
      ),
      emblem: allItems.filter(
        (item) => item.bucketHash === bucketHashes.emblem
      ),
    };
  };

  // Fonction pour obtenir le nom du bucket
  const getBucketName = (bucketHash) => {
    const bucketNames = {
      1498876634: "Arme Primaire",
      2465295065: "Arme Spéciale",
      953998645: "Arme Lourde",
      3448274439: "Casque",
      3551918588: "Gants",
      14239492: "Plastron",
      20886954: "Jambières",
      1585787867: "Armure de Classe",
      4023194814: "Spectre",
      284967655: "Vaisseau",
      2025709351: "Speeder",
      4274335291: "Emblème",
    };
    return bucketNames[bucketHash] || `Bucket ${bucketHash}`;
  };

  if (!character) {
    return (
      <div className="character-detail-error">
        <h2>❌ Personnage non trouvé</h2>
        <button onClick={() => navigate("/")} className="back-btn">
          Retour aux gardiens
        </button>
      </div>
    );
  }

  const organizedEquipment = organizeEquipment(characterEquipment);

  return (
    <div className="character-detail">
      {/* Header du personnage */}
      <div className="character-detail-header">
        <button onClick={() => navigate("/")} className="back-btn">
          ← Retour aux gardiens
        </button>

        <div className="character-summary">
          <div
            className="character-banner"
            style={{
              backgroundImage: character.emblemBackgroundPath
                ? `url(https://www.bungie.net${character.emblemBackgroundPath})`
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <div className="character-info-overlay">
              <h1>
                {character.className} {character.raceTypeName}
              </h1>
              <div className="character-stats-summary">
                <span className="level">Niveau {character.level}</span>
                <span className="light">⚡ {character.light}</span>
                <span className="playtime">
                  🕐 {Math.floor(character.minutesPlayedTotal / 60)}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation des slots */}
      <div className="equipment-navigation">
        {Object.keys(organizedEquipment).map((slotType) => (
          <button
            key={slotType}
            onClick={() => setActiveSlot(slotType)}
            className={`slot-tab ${activeSlot === slotType ? "active" : ""}`}
          >
            <span className="slot-icon">{getSlotIcon(slotType)}</span>
            <span className="slot-name">
              {slotType.charAt(0).toUpperCase() + slotType.slice(1)}
            </span>
            <span className="slot-count">
              ({organizedEquipment[slotType]?.length || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Contenu des équipements */}
      <div className="equipment-content">
        {loading ? (
          <div className="equipment-loading">
            <h3>🔄 Chargement des équipements...</h3>
            <p>Récupération depuis Bungie...</p>
          </div>
        ) : (
          <div className="equipment-grid">
            {organizedEquipment[activeSlot]?.length > 0 ? (
              organizedEquipment[activeSlot].map((item, index) => {
                const details = itemDetails[item.itemHash] || {};
                const rarityColor = getRarityColor(details.tierType);

                return (
                  <div
                    key={item.itemInstanceId || index}
                    className="equipment-item"
                    style={{ borderColor: rarityColor }}
                  >
                    <div className="item-icon">
                      {details.icon ? (
                        <img
                          src={`https://www.bungie.net${details.icon}`}
                          alt={details.name || "Item"}
                          style={{ borderColor: rarityColor }}
                        />
                      ) : (
                        <div className="item-placeholder">
                          {getSlotIcon(activeSlot)}
                        </div>
                      )}

                      {/* Badge de rareté */}
                      {details.tierTypeName && (
                        <div
                          className="rarity-badge"
                          style={{ backgroundColor: rarityColor }}
                        >
                          {details.tierTypeName}
                        </div>
                      )}
                    </div>

                    <div className="item-info">
                      <h4>{details.name || `Item ${index + 1}`}</h4>
                      <p className="item-type">
                        {details.itemTypeDisplayName || getBucketName(item.bucketHash)}
                      </p>
                      {details.description && (
                        <p className="item-description">{details.description}</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-equipment">
                <h3>📭 Aucun équipement</h3>
                <p>Aucun équipement trouvé dans cette catégorie</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterDetail;
