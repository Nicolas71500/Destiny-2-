import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBungieAuth } from "../hooks/useBungieAuth";
import StatAnalyzer from "./StatAnalyzer";
import BuildOptimizer from "./BuildOptimizer";

const CharacterDetail = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();

  // ⭐ TOUS LES HOOKS EN PREMIER (sans conditions)
  const {
    characters,
    selectedPlatform,
    loading: authLoading,
  } = useBungieAuth();

  const [characterEquipment, setCharacterEquipment] = useState(null);
  const [itemDetails, setItemDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSlot, setActiveSlot] = useState("weapons");
  const [characterStats, setCharacterStats] = useState(null);
  const [activeTab, setActiveTab] = useState("equipment");

  // ⭐ AJOUTE CES STATES :
  const [fullInventory, setFullInventory] = useState(null);
  const [vaultItems, setVaultItems] = useState(null);

  // Trouve le personnage sélectionné
  const character = characters?.find((char) => char.id === characterId);

  // ⭐ useEffect APRÈS tous les autres hooks
  useEffect(() => {
    if (character && selectedPlatform) {
      loadCharacterEquipment();
      loadCharacterStats();
    }
  }, [character, selectedPlatform]);

  // ⭐ MAINTENANT les conditions de rendu (après tous les hooks)
  if (authLoading || !characters) {
    return (
      <div className="character-detail-loading">
        <h2>🔄 Chargement du personnage...</h2>
        <div className="spinner">⏳</div>
        <p>Récupération des données depuis Bungie...</p>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="character-detail-error">
        <h2>❌ Personnage non trouvé</h2>
        <p>Le personnage avec l'ID {characterId} n'existe pas.</p>
        <button onClick={() => navigate("/")} className="back-btn">
          Retour aux gardiens
        </button>
      </div>
    );
  }

  // ⭐ Toutes tes fonctions restent identiques
  const loadCharacterEquipment = async () => {
    try {
      setLoading(true);
      console.log("🔍 Chargement équipements pour:", character.className);

      // === 1. ÉQUIPEMENT ACTUEL DU PERSONNAGE ===
      const equipmentResponse = await fetch(
        "https://127.0.0.1:3001/api/character-equipment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: localStorage.getItem("bungie_access_token"),
            membershipType: selectedPlatform.membershipType,
            membershipId: selectedPlatform.membershipId,
            characterId: characterId,
          }),
        }
      );

      let allItems = [];

      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        console.log("🎮 Équipement du personnage:", equipmentData);
        setCharacterEquipment(equipmentData);

        // Ajoute l'équipement et l'inventaire du personnage
        if (equipmentData.inventory?.data?.items) {
          allItems.push(...equipmentData.inventory.data.items);
        }
        if (equipmentData.equipment?.data?.items) {
          allItems.push(...equipmentData.equipment.data.items);
        }
      }

      // === 2. INVENTAIRE COMPLET DU COMPTE ===
      console.log("📦 Récupération de l'inventaire complet...");

      const fullInventoryResponse = await fetch(
        "https://127.0.0.1:3001/api/full-inventory",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: localStorage.getItem("bungie_access_token"),
            membershipType: selectedPlatform.membershipType,
            membershipId: selectedPlatform.membershipId,
          }),
        }
      );

      if (fullInventoryResponse.ok) {
        const fullInventoryData = await fullInventoryResponse.json();
        console.log("🗄️ Inventaire complet:", fullInventoryData);
        setFullInventory(fullInventoryData);

        // Ajoute TOUS les items de l'inventaire
        if (fullInventoryData.profileInventory?.data?.items) {
          allItems.push(...fullInventoryData.profileInventory.data.items);
        }

        // Ajoute les items de TOUS les personnages
        if (fullInventoryData.characterInventories?.data) {
          Object.values(fullInventoryData.characterInventories.data).forEach(
            (charInv) => {
              if (charInv.items) {
                allItems.push(...charInv.items);
              }
            }
          );
        }

        // Ajoute les items du COFFRE/VAULT
        if (fullInventoryData.profileInventory?.data?.items) {
          const vaultItems =
            fullInventoryData.profileInventory.data.items.filter(
              (item) => item.bucketHash === 138197802 // Vault bucket
            );
          console.log("🏦 Items du coffre:", vaultItems.length);
          setVaultItems(vaultItems);
          allItems.push(...vaultItems);
        }
      }

      console.log("📊 TOTAL items récupérés:", allItems.length);

      // === 3. RÉCUPÈRE LES DÉTAILS DE TOUS LES ITEMS ===
      const uniqueHashes = [...new Set(allItems.map((item) => item.itemHash))];
      console.log("🔍 Hashes uniques à analyser:", uniqueHashes.length);

      if (uniqueHashes.length > 0) {
        try {
          const detailsResponse = await fetch(
            "https://127.0.0.1:3001/api/item-details",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemHashes: uniqueHashes }),
            }
          );

          if (detailsResponse.ok) {
            const details = await detailsResponse.json();
            console.log(
              "✨ Détails récupérés pour",
              Object.keys(details).length,
              "items"
            );
            setItemDetails(details);
          }
        } catch (detailError) {
          console.error("❌ Exception détails:", detailError);
        }
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCharacterStats = async () => {
    try {
      console.log("📊 Chargement des stats pour:", character.className);

      const response = await fetch(
        "https://127.0.0.1:3001/api/character-stats",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: localStorage.getItem("bungie_access_token"),
            membershipType: selectedPlatform.membershipType,
            membershipId: selectedPlatform.membershipId,
            characterId: characterId,
          }),
        }
      );

      if (response.ok) {
        const statsData = await response.json();
        console.log("📊 Stats récupérées:", statsData);
        setCharacterStats(statsData);

        // ⭐ AJOUTE AUSSI les itemInstances globales
        if (statsData.itemInstances) {
          console.log(
            "🎯 ItemInstances disponibles:",
            Object.keys(statsData.itemInstances).length
          );
        } else {
          console.log("❌ Pas d'itemInstances dans les stats");
        }
      } else {
        console.error("❌ Erreur chargement stats");
      }
    } catch (error) {
      console.error("❌ Erreur stats:", error);
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
      2: "#ffffff", // ✅ Commun = Blanc
      3: "#1eac20", // ✅ Peu commun = Vert
      4: "#5076a3", // ✅ Rare = Bleu
      5: "#522f65", // ✅ Légendaire = Violet
      6: "#ceae33", // ✅ Exotique = Doré/Jaune
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

      {/* Navigation principale */}
      <div className="main-navigation">
        <div className="character-tabs">
          <button
            onClick={() => setActiveTab("equipment")}
            className={`tab ${activeTab === "equipment" ? "active" : ""}`}
          >
            ⚔️ Équipements
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`tab ${activeTab === "stats" ? "active" : ""}`}
          >
            📊 Statistiques
          </button>
          <button
            onClick={() => setActiveTab("optimizer")}
            className={`tab ${activeTab === "optimizer" ? "active" : ""}`}
          >
            🎯 Optimisateur
          </button>
        </div>

        {/* Navigation des équipements (seulement si onglet équipement actif) */}
        {activeTab === "equipment" && (
          <div className="equipment-navigation">
            {Object.keys(organizedEquipment).map((slotType) => (
              <button
                key={slotType}
                onClick={() => setActiveSlot(slotType)}
                className={`slot-tab ${
                  activeSlot === slotType ? "active" : ""
                }`}
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
        )}
      </div>

      {/* Contenu principal */}
      <div className="character-content">
        {activeTab === "equipment" && (
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
                            {details.itemTypeDisplayName ||
                              getBucketName(item.bucketHash)}
                          </p>
                          {details.description && (
                            <p className="item-description">
                              {details.description}
                            </p>
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
        )}

        {activeTab === "stats" && (
          <div className="stats-content">
            {/* 🔍 DEBUG COMPLET AVANT STATANALYZER */}
            {(() => {
              console.log("🎯 === DEBUG STATS POUR STATANALYZER ===");
              console.log("characterStats disponible:", !!characterStats);
              console.log(
                "characterStats.characterStats:",
                characterStats?.characterStats
              );
              console.log(
                "Clés des stats:",
                Object.keys(characterStats?.characterStats || {})
              );
              console.log(
                "Valeurs des stats:",
                Object.values(characterStats?.characterStats || {})
              );
              console.log("=== FIN DEBUG STATS ===");
              return null;
            })()}

            {characterStats ? (
              <StatAnalyzer
                characterStats={characterStats.characterStats}
                equipment={characterStats.equipment}
                itemInstances={characterStats.itemInstances}
              />
            ) : (
              <div className="stats-loading">
                <h3>📊 Chargement des statistiques...</h3>
                <p>Récupération des données depuis Bungie...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "optimizer" && (
          <div className="optimizer-content">
            {/* 🔍 DEBUG COMPLET DES PROPS */}
            {(() => {
              console.log("🎯 === DEBUG PROPS BUILDOPTIMIZER ===");
              console.log("characterStats:", characterStats);
              console.log(
                "characterStats?.itemInstances:",
                characterStats?.itemInstances
              );
              console.log(
                "Nombre d'itemInstances:",
                Object.keys(characterStats?.itemInstances || {}).length
              );
              console.log("fullInventory:", !!fullInventory);
              console.log("=== FIN DEBUG ===");
              return null;
            })()}

            <BuildOptimizer
              characterStats={characterStats?.characterStats}
              equipment={characterStats?.equipment}
              itemInstances={characterStats?.itemInstances || {}}
              inventory={characterEquipment?.inventory?.data?.items}
              fullInventory={fullInventory}
              vaultItems={vaultItems}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterDetail;
