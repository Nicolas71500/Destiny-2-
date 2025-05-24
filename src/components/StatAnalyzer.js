import React, { useState, useEffect } from "react";

const StatAnalyzer = ({ characterStats, equipment, itemInstances }) => {
  const [itemDetails, setItemDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Définition des stats Destiny 2 avec couleurs améliorées
  const statDefinitions = {
    2996146975: {
      name: "Mobilité",
      icon: "🏃‍♂️",
      color: "#00d4aa",
      description: "Vitesse de déplacement et saut",
    },
    392767087: {
      name: "Résilience",
      icon: "🛡️",
      color: "#f39c12",
      description: "Résistance aux dégâts et santé",
    },
    1943323491: {
      name: "Récupération",
      icon: "💚",
      color: "#27ae60",
      description: "Régénération de la santé",
    },
    1735777505: {
      name: "Discipline",
      icon: "💣",
      color: "#e74c3c",
      description: "Cooldown des grenades",
    },
    144602215: {
      name: "Intelligence",
      icon: "🧠",
      color: "#3498db",
      description: "Cooldown du super",
    },
    4244567218: {
      name: "Force",
      icon: "👊",
      color: "#9b59b6",
      description: "Cooldown de la mêlée",
    },
  };

  // Charge les détails de tous les items équipés
  useEffect(() => {
    const loadItemDetails = async () => {
      if (!equipment || equipment.length === 0) return;

      setLoadingDetails(true);
      console.log(
        "📦 Chargement détails pour",
        equipment.length,
        "items équipés"
      );

      try {
        // Récupère les hashes de tous les items équipés
        const itemHashes = equipment.map((item) => item.itemHash);

        const response = await fetch(
          "https://127.0.0.1:3001/api/item-details",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemHashes }),
          }
        );

        if (response.ok) {
          const details = await response.json();
          console.log(
            "✅ Détails récupérés pour",
            Object.keys(details).length,
            "items"
          );
          setItemDetails(details);
        } else {
          console.error("❌ Erreur chargement détails items");
        }
      } catch (error) {
        console.error("❌ Erreur:", error);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadItemDetails();
  }, [equipment]);

  // Calcule les tiers et bénéfices
  const calculateTier = (statValue) => Math.floor(statValue / 10);
  const getNextTierCost = (statValue) => 10 - (statValue % 10);

  // Calcule les cooldowns avec formules précises
  const calculateCooldowns = (stats) => {
    const discipline = stats[1735777505] || 0;
    const intellect = stats[144602215] || 0;
    const strength = stats[4244567218] || 0;

    return {
      grenade: Math.max(105 - (discipline / 10) * 6, 32),
      super: Math.max(502 - (intellect / 10) * 25, 300),
      melee: Math.max(100 - (strength / 10) * 6, 29),
    };
  };

  // Organise l'équipement avec tous les détails
  const organizeEquipment = () => {
    const equipped = {};
    const bucketMap = {
      1498876634: {
        name: "Arme principale",
        icon: "🔫",
        slot: "kinetic",
        category: "weapon",
        order: 1,
      },
      2465295065: {
        name: "Arme secondaire",
        icon: "⚡",
        slot: "energy",
        category: "weapon",
        order: 2,
      },
      953998645: {
        name: "Arme lourde",
        icon: "💥",
        slot: "power",
        category: "weapon",
        order: 3,
      },
      3448274439: {
        name: "Casque",
        icon: "⛑️",
        slot: "helmet",
        category: "armor",
        order: 4,
      },
      3551918588: {
        name: "Gantelets",
        icon: "🧤",
        slot: "gauntlets",
        category: "armor",
        order: 5,
      },
      14239492: {
        name: "Plastron",
        icon: "🦺",
        slot: "chest",
        category: "armor",
        order: 6,
      },
      20886954: {
        name: "Jambières",
        icon: "👖",
        slot: "legs",
        category: "armor",
        order: 7,
      },
      1585787867: {
        name: "Marque de classe",
        icon: "🎗️",
        slot: "classItem",
        category: "armor",
        order: 8,
      },
    };

    equipment.forEach((item) => {
      const bucketInfo = bucketMap[item.bucketHash];
      if (bucketInfo) {
        const details = itemDetails[item.itemHash] || {};
        equipped[bucketInfo.slot] = {
          ...item,
          bucketInfo,
          details,
          instance: itemInstances[item.itemInstanceId] || {},
        };
      }
    });

    return equipped;
  };

  // Fonction pour obtenir la couleur de rareté
  const getRarityColor = (tierType) => {
    const rarityColors = {
      2: "#ffffff", // Commun (blanc)
      3: "#1eac20", // Peu commun (vert)
      4: "#5076a3", // Rare (bleu)
      5: "#522f65", // Légendaire (violet)
      6: "#ceae33", // Exotique (doré)
    };
    return rarityColors[tierType] || "#ffffff";
  };

  const cooldowns = calculateCooldowns(characterStats);
  const equippedItems = organizeEquipment();

  // Organise par catégories avec ordre
  const organizedByCategory = Object.entries(equippedItems)
    .sort((a, b) => a[1].bucketInfo.order - b[1].bucketInfo.order)
    .reduce((acc, [slot, item]) => {
      const category = item.bucketInfo.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push([slot, item]);
      return acc;
    }, {});

  // Calcule le total des stats
  const totalStats = Object.values(characterStats).reduce(
    (sum, stat) => sum + stat,
    0
  );
  const averageTier = totalStats / 60; // 6 stats

  if (loadingDetails) {
    return (
      <div className="stat-analyzer-enhanced">
        <div className="stats-loading">
          <h3>📊 Chargement de l'analyse complète...</h3>
          <p>Récupération des détails depuis l'API Bungie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-analyzer-enhanced">
      {/* Header avec résumé global */}
      <div className="stats-header">
        <div className="stats-summary-card">
          <h2>📊 Analyse complète du build</h2>
          <div className="global-stats">
            <div className="global-stat">
              <span className="global-label">Total Stats</span>
              <span className="global-value">{totalStats}</span>
            </div>
            <div className="global-stat">
              <span className="global-label">Tier moyen</span>
              <span className="global-value">{averageTier.toFixed(1)}</span>
            </div>
            <div className="global-stat">
              <span className="global-label">Items équipés</span>
              <span className="global-value">
                {Object.keys(equippedItems).length}/8
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid principal : Stats + Équipement */}
      <div className="main-content-grid">
        {/* Section Stats détaillées */}
        <div className="stats-section">
          <h3>⚡ Statistiques du personnage</h3>
          <div className="stats-grid-enhanced">
            {Object.entries(statDefinitions).map(([hash, def]) => {
              const value = characterStats[hash] || 0;
              const tier = calculateTier(value);
              const nextTierCost = getNextTierCost(value);
              const percentage = Math.min(value, 100);

              return (
                <div key={hash} className="stat-card-enhanced">
                  <div className="stat-header-enhanced">
                    <div
                      className="stat-icon-large"
                      style={{ color: def.color }}
                    >
                      {def.icon}
                    </div>
                    <div className="stat-info">
                      <h4 className="stat-name-enhanced">{def.name}</h4>
                      <p className="stat-description">{def.description}</p>
                    </div>
                  </div>

                  <div className="stat-values">
                    <div
                      className="stat-main-value"
                      style={{ color: def.color }}
                    >
                      {value}
                    </div>
                    <div
                      className="stat-tier-badge"
                      style={{ backgroundColor: def.color }}
                    >
                      T{tier}
                    </div>
                  </div>

                  {/* Barre de progression circulaire */}
                  <div className="circular-progress">
                    <svg width="60" height="60" className="progress-ring">
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        stroke={def.color}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${percentage * 1.57} 157`}
                        strokeLinecap="round"
                        transform="rotate(-90 30 30)"
                        className="progress-circle"
                      />
                    </svg>
                    <div className="progress-text">
                      <span className="progress-percentage">{percentage}%</span>
                    </div>
                  </div>

                  {value < 100 && (
                    <div className="next-tier-info">
                      <span className="next-tier-text">
                        +{nextTierCost} pour T{tier + 1}
                      </span>
                      <div className="next-tier-bar">
                        <div
                          className="next-tier-fill"
                          style={{
                            width: `${((value % 10) / 10) * 100}%`,
                            backgroundColor: def.color,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Équipement avec style original */}
        <div className="equipment-section">
          <h3>⚔️ Équipement équipé</h3>

          <div className="equipped-items-grid">
            {Object.entries(equippedItems)
              .sort((a, b) => a[1].bucketInfo.order - b[1].bucketInfo.order)
              .map(([slot, item]) => {
                const rarityColor = getRarityColor(item.details.tierType);
                const itemName = item.details.name || item.bucketInfo.name;
                const hasImage = item.details.icon;

                return (
                  <div key={slot} className="equipped-item-card">
                    <div className="equipped-item-icon">
                      {hasImage ? (
                        <img
                          src={`https://www.bungie.net${item.details.icon}`}
                          alt={itemName}
                          className="equipped-item-image"
                          style={{ borderColor: rarityColor }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextElementSibling.style.display = "flex";
                          }}
                        />
                      ) : null}

                      {/* Fallback si pas d'image */}
                      <div
                        className="equipped-item-placeholder"
                        style={{ display: hasImage ? "none" : "flex" }}
                      >
                        <span className="bucket-icon">
                          {item.bucketInfo.icon}
                        </span>
                      </div>
                    </div>

                    <div className="equipped-item-info">
                      <h5
                        className="equipped-item-name"
                        style={{ color: rarityColor }}
                      >
                        {itemName}
                      </h5>
                      <p className="equipped-item-type">
                        {item.details.itemTypeDisplayName ||
                          item.bucketInfo.name}
                      </p>

                      {/* Niveau de puissance pour les armes */}
                      {item.instance.primaryStat && (
                        <div className="item-power">
                          ⚡ {item.instance.primaryStat.value}
                        </div>
                      )}

                      {/* Description */}
                      {item.details.description && (
                        <p className="equipped-item-description">
                          {item.details.description}
                        </p>
                      )}
                    </div>

                    <div className="equipped-item-stats">
                      {/* Stats secondaires pour l'armure */}
                      {item.instance.stats?.data && (
                        <div className="secondary-stats">
                          {Object.entries(item.instance.stats.data)
                            .filter(([statHash]) => statDefinitions[statHash])
                            .slice(0, 3)
                            .map(([statHash, stat]) => {
                              const statDef = statDefinitions[statHash];
                              return (
                                <div key={statHash} className="secondary-stat">
                                  <span
                                    className="secondary-stat-icon"
                                    style={{ color: statDef.color }}
                                  >
                                    {statDef.icon}
                                  </span>
                                  <span className="secondary-stat-value">
                                    +{stat.value}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Section Cooldowns */}
      <div className="cooldowns-section-enhanced">
        <h3>⏱️ Temps de recharge optimisés</h3>
        <div className="cooldowns-grid-enhanced">
          <div className="cooldown-card grenade">
            <div className="cooldown-icon-big">💣</div>
            <div className="cooldown-info">
              <h4>Grenade</h4>
              <div className="cooldown-time-big">
                {Math.round(cooldowns.grenade)}s
              </div>
              <div className="cooldown-tier">
                T{calculateTier(characterStats[1735777505] || 0)} Discipline
              </div>
            </div>
          </div>

          <div className="cooldown-card super">
            <div className="cooldown-icon-big">⚡</div>
            <div className="cooldown-info">
              <h4>Super</h4>
              <div className="cooldown-time-big">
                {Math.round(cooldowns.super)}s
              </div>
              <div className="cooldown-tier">
                T{calculateTier(characterStats[144602215] || 0)} Intelligence
              </div>
            </div>
          </div>

          <div className="cooldown-card melee">
            <div className="cooldown-icon-big">👊</div>
            <div className="cooldown-info">
              <h4>Mêlée</h4>
              <div className="cooldown-time-big">
                {Math.round(cooldowns.melee)}s
              </div>
              <div className="cooldown-tier">
                T{calculateTier(characterStats[4244567218] || 0)} Force
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions d'optimisation */}
      <div className="optimization-suggestions">
        <h3>💡 Suggestions d'optimisation</h3>
        <div className="suggestions-grid">
          {Object.entries(characterStats).map(([hash, value]) => {
            const def = statDefinitions[hash];
            const tier = calculateTier(value);
            const nextTierCost = getNextTierCost(value);

            if (!def || value >= 100 || nextTierCost > 8) return null;

            const priority =
              nextTierCost <= 3
                ? "haute"
                : nextTierCost <= 6
                ? "moyenne"
                : "basse";
            const priorityIcon =
              priority === "haute"
                ? "🔥"
                : priority === "moyenne"
                ? "⚠️"
                : "💡";

            return (
              <div
                key={hash}
                className={`suggestion-card priority-${priority}`}
              >
                <div className="suggestion-icon" style={{ color: def.color }}>
                  {def.icon}
                </div>
                <div className="suggestion-content">
                  <h5>{def.name}</h5>
                  <p>
                    +{nextTierCost} points → Tier {tier + 1}
                  </p>
                </div>
                <div className="suggestion-priority">
                  {priorityIcon}
                  <span>{priority}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatAnalyzer;
