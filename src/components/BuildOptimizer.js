import React, { useState, useEffect } from "react";

const BuildOptimizer = ({
  characterStats,
  equipment,
  itemInstances,
  inventory,
  fullInventory,
  vaultItems,
}) => {
  // ⭐ ÉTATS DU COMPOSANT
  const [selectedGoal, setSelectedGoal] = useState("pvp");
  const [loadingOptimization, setLoadingOptimization] = useState(false);
  const [optimizedBuilds, setOptimizedBuilds] = useState([]);
  const [currentBuild, setCurrentBuild] = useState(null);
  const [itemDetails, setItemDetails] = useState({});
  const [armorPieces, setArmorPieces] = useState({
    helmet: [],
    gauntlets: [],
    chest: [],
    legs: [],
    classItem: [],
  });

  // ⭐ DÉFINITIONS DES STATS DESTINY 2
  const statDefinitions = {
    2996146975: {
      name: "Mobilité",
      icon: "🏃",
      color: "#00d4aa",
      description: "Vitesse de déplacement et de saut",
    },
    392767087: {
      name: "Résilience",
      icon: "🛡️",
      color: "#f3431e",
      description: "Résistance aux dégâts et temps de récupération des PV",
    },
    1943323491: {
      name: "Récupération",
      icon: "💚",
      color: "#80a755",
      description: "Vitesse de régénération des points de vie",
    },
    1735777505: {
      name: "Discipline",
      icon: "💥",
      color: "#d07b00",
      description: "Temps de recharge des grenades",
    },
    144602215: {
      name: "Intelligence",
      icon: "🧠",
      color: "#5dadec",
      description: "Temps de recharge du Super",
    },
    4244567218: {
      name: "Force",
      icon: "👊",
      color: "#c679a0",
      description: "Temps de recharge de l'attaque de mêlée",
    },
  };

  // ⭐ OBJECTIFS DE BUILD PRÉDÉFINIS
  const buildGoals = {
    pvp: {
      name: "🎯 PvP Compétitif",
      description: "Mobilité et Résilience maximum pour la survie en PvP",
      priorities: {
        2996146975: 100, // Mobilité - CRITIQUE
        392767087: 100, // Résilience - CRITIQUE
        1735777505: 80, // Discipline - Important
        1943323491: 60, // Récupération - Moyen
        4244567218: 40, // Force - Faible
        144602215: 30, // Intelligence - Très faible
      },
    },

    pve_tank: {
      name: "🛡️ Tank PvE",
      description: "Résilience et Récupération pour tanker en PvE",
      priorities: {
        392767087: 100, // Résilience - CRITIQUE
        1943323491: 100, // Récupération - CRITIQUE
        144602215: 80, // Intelligence - Important
        1735777505: 60, // Discipline - Moyen
        4244567218: 40, // Force - Faible
        2996146975: 20, // Mobilité - Très faible
      },
    },

    pve_dps: {
      name: "💥 DPS PvE",
      description: "Discipline et Intelligence pour les capacités",
      priorities: {
        1735777505: 100, // Discipline - CRITIQUE
        144602215: 100, // Intelligence - CRITIQUE
        4244567218: 80, // Force - Important
        1943323491: 60, // Récupération - Moyen
        392767087: 40, // Résilience - Faible
        2996146975: 20, // Mobilité - Très faible
      },
    },

    balanced: {
      name: "⚖️ Équilibré",
      description: "Build équilibré pour toutes les activités",
      priorities: {
        392767087: 85, // Résilience - Très important
        1943323491: 80, // Récupération - Important
        1735777505: 75, // Discipline - Important
        144602215: 70, // Intelligence - Important
        2996146975: 65, // Mobilité - Assez important
        4244567218: 60, // Force - Moyen
      },
    },

    endgame: {
      name: "👑 Endgame",
      description: "Build haut niveau pour raids et donjons",
      priorities: {
        392767087: 100, // Résilience - CRITIQUE (T10 obligatoire)
        1943323491: 90, // Récupération - Très important
        144602215: 85, // Intelligence - Très important
        1735777505: 70, // Discipline - Important
        2996146975: 50, // Mobilité - Moyen
        4244567218: 40, // Force - Faible
      },
    },

    speed: {
      name: "💨 Vitesse",
      description: "Build axé sur la mobilité et vitesse",
      priorities: {
        2996146975: 100, // Mobilité - CRITIQUE
        1943323491: 80, // Récupération - Important
        4244567218: 70, // Force - Important (pour les glissades)
        1735777505: 60, // Discipline - Moyen
        392767087: 50, // Résilience - Moyen
        144602215: 40, // Intelligence - Faible
      },
    },
  };

  // ⭐ BUCKETS D'ARMES (à ignorer)
  const weaponBuckets = [
    1498876634, // Arme cinétique
    2465295065, // Arme élémentaire
    953998645, // Arme lourde
    138197802, // Objets généraux/consommables
    215593132, // Sous-classe/mods
    3284755031, // Autre équipement
    497170007, // Emblèmes
    444348033, // Véhicules
    4274335291, // Navires
    3683254069, // Shaders
    3621873013, // Ornements
    1801258597, // Mods d'armes
    2422292810, // Matériaux
    1345459588, // Objets de quête
    // Ajoutez d'autres buckets non-armure si nécessaire
  ];

  // ⭐ BUCKETS D'ARMURE (à traiter)
  const armorBuckets = {
    3448274439: { name: "Casque", slot: "helmet", icon: "⛑️" },
    3551918588: { name: "Gantelets", slot: "gauntlets", icon: "🧤" },
    14239492: { name: "Plastron", slot: "chest", icon: "🦺" },
    20886954: { name: "Jambières", slot: "legs", icon: "👖" },
    1585787867: { name: "Marque de classe", slot: "classItem", icon: "🎗️" },
  };

  // Charge les détails des items
  useEffect(() => {
    loadAllItemDetails();
  }, [inventory, equipment]);

  const loadAllItemDetails = async () => {
    if (!inventory && !fullInventory) return;

    try {
      setLoadingOptimization(true);

      // === COMBINE TOUTES LES SOURCES D'ITEMS ===
      let allItems = [];

      // 1. Inventaire du personnage actuel
      if (inventory) {
        console.log("📦 Inventaire personnage:", inventory.length);
        allItems.push(...inventory);
      }

      // 2. Équipement actuel
      if (equipment) {
        console.log("⚔️ Équipement actuel:", equipment.length);
        allItems.push(...equipment);
      }

      // 3. Inventaire complet du profil
      if (fullInventory?.profileInventory?.data?.items) {
        console.log(
          "🗄️ Inventaire profil:",
          fullInventory.profileInventory.data.items.length
        );
        allItems.push(...fullInventory.profileInventory.data.items);
      }

      // 4. Inventaires de TOUS les personnages
      if (fullInventory?.characterInventories?.data) {
        Object.entries(fullInventory.characterInventories.data).forEach(
          ([charId, charInv]) => {
            if (charInv.items) {
              console.log(
                `👤 Inventaire personnage ${charId}:`,
                charInv.items.length
              );
              allItems.push(...charInv.items);
            }
          }
        );
      }

      // 5. Items du coffre
      if (vaultItems) {
        console.log("🏦 Items du coffre:", vaultItems.length);
        allItems.push(...vaultItems);
      }

      console.log("📊 TOTAL items avant filtrage:", allItems.length);

      // === FILTRE SEULEMENT L'ARMURE ===
      console.log("🔍 Debug des premiers items:");
      allItems.slice(0, 10).forEach((item, i) => {
        console.log(
          `  ${i + 1}. Bucket: ${item.bucketHash}, Hash: ${item.itemHash}`
        );
      });

      console.log("🔍 Buckets d'armure recherchés:", Object.keys(armorBuckets));

      const armorItems = allItems.filter((item) => {
        const bucketHashStr = item.bucketHash.toString();

        // ⭐ Ignorer explicitement les armes
        if (weaponBuckets.includes(item.bucketHash)) {
          return false;
        }

        // ⭐ Accepter seulement les buckets d'armure connus
        const isKnownArmorBucket =
          Object.keys(armorBuckets).includes(bucketHashStr);

        if (isKnownArmorBucket) {
          console.log(`✅ Armure trouvée: bucket ${item.bucketHash}`);
        } else {
          // Log seulement les premiers buckets inconnus pour éviter le spam
          if (Math.random() < 0.01) {
            // 1% de chance de logger
            console.log(
              `❓ Bucket inconnu: ${item.bucketHash} (item: ${item.itemHash})`
            );
          }
        }

        return isKnownArmorBucket;
      });

      console.log("🛡️ Pièces d'armure trouvées:", armorItems.length);

      // Log par type d'armure
      Object.entries(armorBuckets).forEach(([bucketHash, info]) => {
        const count = armorItems.filter(
          (item) => item.bucketHash.toString() === bucketHash
        ).length;
        console.log(`  ${info.name} (${bucketHash}): ${count} pièces`);
      });

      const itemHashes = [...new Set(armorItems.map((item) => item.itemHash))];

      if (itemHashes.length === 0) {
        console.log("❌ Aucune armure trouvée !");
        return;
      }

      console.log("🔍 Chargement de", itemHashes.length, "types d'armure...");

      const response = await fetch("https://127.0.0.1:3001/api/item-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemHashes }),
      });

      if (response.ok) {
        const details = await response.json();
        setItemDetails(details);
        console.log(
          "✅ Détails chargés pour",
          Object.keys(details).length,
          "items"
        );
      }
    } catch (error) {
      console.error("❌ Erreur chargement détails:", error);
    } finally {
      setLoadingOptimization(false);
    }
  };

  // ⭐ AMÉLIORER getArmorStats pour traiter les itemInstances vides
  const getArmorStats = (item) => {
    const stats = {};

    console.log(`🔍 === ANALYSE STATS ITEM ===`);
    console.log(`Nom: ${itemDetails[item.itemHash]?.name || "Inconnu"}`);
    console.log(`ItemInstanceId: ${item.itemInstanceId}`);

    // ⭐ SOLUTION 1: Vérifier directement dans les données d'équipement
    if (equipment && equipment.length > 0) {
      const equippedItem = equipment.find(
        (equip) => equip.itemInstanceId === item.itemInstanceId
      );
      if (equippedItem && equippedItem.stats) {
        console.log(`✅ Stats trouvées dans l'équipement`);
        Object.entries(equippedItem.stats).forEach(([statHash, statValue]) => {
          if (statDefinitions[statHash]) {
            stats[statHash] = statValue;
          }
        });
      }
    }

    // ⭐ SOLUTION 2: Utiliser characterStats si disponible
    if (Object.keys(stats).length === 0 && characterStats?.itemInstances) {
      const instance = characterStats.itemInstances[item.itemInstanceId];
      if (instance?.stats?.data) {
        console.log(`✅ Stats trouvées dans characterStats`);
        Object.entries(instance.stats.data).forEach(([statHash, stat]) => {
          if (statDefinitions[statHash] && stat.value !== undefined) {
            stats[statHash] = stat.value;
          }
        });
      }
    }

    // ⭐ SOLUTION 3: Essayer avec itemInstances
    if (
      Object.keys(stats).length === 0 &&
      itemInstances &&
      item.itemInstanceId
    ) {
      const instance = itemInstances[item.itemInstanceId];
      if (instance?.stats?.data) {
        console.log(`✅ Stats trouvées dans itemInstances`);
        Object.entries(instance.stats.data).forEach(([statHash, stat]) => {
          if (statDefinitions[statHash] && stat.value !== undefined) {
            stats[statHash] = stat.value;
          }
        });
      }
    }

    // ⭐ SOLUTION 4: AMÉLIORER les stats par défaut avec des valeurs plus réalistes
    if (Object.keys(stats).length === 0 && itemDetails[item.itemHash]) {
      const details = itemDetails[item.itemHash];
      console.log(`🔄 Génération de stats réalistes pour: ${details.name}`);

      // ⭐ STATS DE BASE MEILLEURES basées sur le type d'armure
      const statDistributions = [
        // Distribution 1: Mobilité/Récupération
        {
          2996146975: 16,
          392767087: 8,
          1943323491: 18,
          1735777505: 6,
          144602215: 10,
          4244567218: 2,
        },
        // Distribution 2: Résilience/Discipline
        {
          2996146975: 6,
          392767087: 22,
          1943323491: 8,
          1735777505: 18,
          144602215: 12,
          4244567218: 4,
        },
        // Distribution 3: Intelligence/Force
        {
          2996146975: 10,
          392767087: 12,
          1943323491: 6,
          1735777505: 8,
          144602215: 20,
          4244567218: 14,
        },
        // Distribution 4: Équilibré haut
        {
          2996146975: 14,
          392767087: 16,
          1943323491: 14,
          1735777505: 12,
          144602215: 8,
          4244567218: 6,
        },
        // Distribution 5: Focus Résilience/Récupération
        {
          2996146975: 8,
          392767087: 20,
          1943323491: 20,
          1735777505: 10,
          144602215: 6,
          4244567218: 6,
        },
      ];

      // Sélectionne une distribution basée sur le hash de l'item (déterministe)
      const distributionIndex = item.itemHash % statDistributions.length;
      const baseDistribution = statDistributions[distributionIndex];

      // Ajoute une petite variation pour les items différents
      Object.entries(baseDistribution).forEach(([statHash, baseValue]) => {
        const variation = (item.itemHash % 7) - 3; // -3 à +3
        stats[statHash] = Math.max(2, baseValue + variation);
      });

      console.log(
        `📊 Stats générées (distribution ${distributionIndex}):`,
        stats
      );
    }

    console.log(`📊 Stats finales extraites:`, stats);
    console.log(`🔢 Nombre de stats: ${Object.keys(stats).length}`);
    console.log(`=== FIN ANALYSE ===\n`);

    return stats;
  };

  // ⭐ AMÉLIORER optimizeBuild pour mieux gérer les sources vides
  const optimizeBuild = () => {
    if (!itemDetails) {
      console.log("❌ Pas de détails d'items chargés");
      return;
    }

    setLoadingOptimization(true);

    setTimeout(() => {
      const goal = buildGoals[selectedGoal];
      const armorPieces = {
        helmet: [],
        gauntlets: [],
        chest: [],
        legs: [],
        classItem: [],
      };

      // === COMBINE TOUTES LES SOURCES AVEC LOGS DÉTAILLÉS ===
      let allArmorItems = [];

      console.log("🔍 === ANALYSE DES SOURCES D'ITEMS ===");

      if (inventory) {
        console.log(`📦 Inventaire: ${inventory.length} items`);
        allArmorItems.push(...inventory);
      } else {
        console.log("❌ Pas d'inventaire");
      }

      if (equipment) {
        console.log(`⚔️ Équipement: ${equipment.length} items`);
        allArmorItems.push(...equipment);
      } else {
        console.log("❌ Pas d'équipement");
      }

      if (fullInventory?.profileInventory?.data?.items) {
        console.log(
          `🗄️ Inventaire profil: ${fullInventory.profileInventory.data.items.length} items`
        );
        allArmorItems.push(...fullInventory.profileInventory.data.items);
      }

      if (fullInventory?.characterInventories?.data) {
        const charItems = Object.values(
          fullInventory.characterInventories.data
        ).reduce((total, charInv) => {
          return total + (charInv.items ? charInv.items.length : 0);
        }, 0);
        console.log(`👥 Inventaires persos: ${charItems} items`);

        Object.values(fullInventory.characterInventories.data).forEach(
          (charInv) => {
            if (charInv.items) allArmorItems.push(...charInv.items);
          }
        );
      }

      if (vaultItems) {
        console.log(`🏦 Coffre: ${vaultItems.length} items`);
        allArmorItems.push(...vaultItems);
      } else {
        console.log("❌ Pas de coffre");
      }

      console.log(`📊 TOTAL ITEMS: ${allArmorItems.length}`);

      // === FILTRE ET ORGANISE L'ARMURE ===
      let armorCount = 0;

      allArmorItems.forEach((item) => {
        const bucketInfo = armorBuckets[item.bucketHash];

        // ⭐ IGNORE EXPLICITEMENT LES ARMES ET AUTRES
        if (weaponBuckets.includes(item.bucketHash)) {
          return; // Skip silencieusement les armes
        }

        if (bucketInfo && itemDetails[item.itemHash]) {
          const stats = getArmorStats(item);
          const details = itemDetails[item.itemHash];

          // ⭐ CONDITION PLUS PERMISSIVE pour l'armure
          const isArmor =
            details.itemType === 2 || // Type armor
            details.itemCategoryHashes?.includes(20) || // Category armor
            bucketInfo; // A un bucket d'armure connu

          if (isArmor && Object.keys(stats).length > 0) {
            armorPieces[bucketInfo.slot].push({
              ...item,
              stats,
              details,
              bucketInfo,
              score: calculateItemScore(stats, goal.priorities),
            });

            armorCount++;

            console.log(
              `✅ Armure ajoutée: ${details.name} au slot ${
                bucketInfo.slot
              } (Score: ${Math.round(
                calculateItemScore(stats, goal.priorities)
              )})`
            );
          }
        }
      });

      console.log(`🛡️ TOTAL ARMURE TROUVÉE: ${armorCount} pièces`);

      // Debug final des slots
      console.log("🛡️ Répartition par slot :");
      Object.entries(armorPieces).forEach(([slot, pieces]) => {
        console.log(`  ${slot}: ${pieces.length} pièces`);
        if (pieces.length > 0) {
          pieces.slice(0, 3).forEach((piece, i) => {
            console.log(
              `    ${i + 1}. ${piece.details.name} (Score: ${Math.round(
                piece.score
              )})`
            );
          });
        }
      });

      // ⭐ SI AUCUNE ARMURE, PROPOSER DES SOLUTIONS
      const totalArmorPieces = Object.values(armorPieces).reduce(
        (sum, pieces) => sum + pieces.length,
        0
      );

      if (totalArmorPieces === 0) {
        console.log("❌ AUCUNE ARMURE TROUVÉE !");
        console.log("🔍 Suggestions:");
        console.log("  1. Vérifiez que vous avez de l'armure équipée");
        console.log("  2. Essayez de charger un autre personnage");
        console.log("  3. Vérifiez la connexion à l'API Bungie");

        setOptimizedBuilds([
          {
            name: "❌ Aucune armure trouvée",
            description: "Vérifiez vos sources d'équipement",
            totalStats: {},
            score: 0,
            incomplete: true,
            error: "NO_ARMOR_FOUND",
          },
        ]);

        setLoadingOptimization(false);
        return;
      }

      // Trie chaque slot par score
      Object.keys(armorPieces).forEach((slot) => {
        armorPieces[slot].sort((a, b) => b.score - a.score);
      });

      setArmorPieces(armorPieces);

      // Génère les builds
      const builds = generateOptimalBuilds(armorPieces, goal.priorities);

      setOptimizedBuilds(builds);
      setLoadingOptimization(false);
    }, 1000);
  };

  // Calcule le score d'un item selon les priorités
  const calculateItemScore = (stats, priorities) => {
    let score = 0;
    Object.entries(priorities).forEach(([statHash, priority]) => {
      const statValue = stats[statHash] || 0;
      score += statValue * (priority / 100);
    });
    return score;
  };

  // Calcule le score d'un build
  const calculateBuildScore = (stats, priorities) => {
    console.log("🧮 === CALCUL SCORE ===");
    console.log("Stats reçues:", stats);
    console.log("Priorités reçues:", priorities);

    let score = 0;
    let totalTiers = 0;
    let maxTierBonus = 0;

    Object.entries(priorities).forEach(([statHash, priority]) => {
      const statValue = stats[statHash] || 0;
      const tier = Math.floor(statValue / 10);

      console.log(
        `Stat ${statHash}: valeur=${statValue}, tier=${tier}, priorité=${priority}`
      );

      // Score de base
      const baseScore = tier * (priority / 100) * 10;
      score += baseScore;

      console.log(`  Score de base: ${baseScore}`);

      // Bonus pour les tiers élevés
      if (tier >= 10) {
        maxTierBonus += 50;
      } else if (tier >= 8) {
        maxTierBonus += 25;
      }

      totalTiers += tier;
    });

    // Bonus pour la somme totale des tiers
    const avgTier = totalTiers / 6;
    let tierBonus = 0;
    if (avgTier >= 8) tierBonus = 100;
    else if (avgTier >= 6) tierBonus = 50;

    const finalScore = Math.round(score + maxTierBonus + tierBonus);

    console.log(
      `Score final: ${finalScore} (base: ${score}, tierBonus: ${maxTierBonus}, avgBonus: ${tierBonus})`
    );
    console.log("=== FIN CALCUL SCORE ===\n");

    return finalScore;
  };

  // Génère les builds optimaux
  const generateOptimalBuilds = (armorPieces, priorities) => {
    console.log("🎯 Génération des builds optimaux...");

    const { helmet, gauntlets, chest, legs, classItem } = armorPieces;

    // Vérification des pièces disponibles
    const slotsAvailable = {
      helmet: helmet.length,
      gauntlets: gauntlets.length,
      chest: chest.length,
      legs: legs.length,
      classItem: classItem.length,
    };

    console.log("📊 Pièces disponibles par slot:", slotsAvailable);

    const missingSlots = Object.entries(slotsAvailable)
      .filter(([slot, count]) => count === 0)
      .map(([slot]) => slot);

    if (missingSlots.length > 0) {
      console.log("❌ Slots manquants:", missingSlots);
      return [
        {
          name: "⚠️ Build incomplet",
          description: `Manque: ${missingSlots.join(", ")}`,
          totalStats: {},
          score: 0,
          incomplete: true,
          missingSlots,
        },
      ];
    }

    const builds = [];
    const seenBuilds = new Set();

    // ⭐ LIMITATION INTELLIGENTE basée sur la quantité d'armure
    const totalCombinations =
      helmet.length *
      gauntlets.length *
      chest.length *
      legs.length *
      classItem.length;
    console.log(
      `🔢 Combinaisons possibles: ${totalCombinations.toLocaleString()}`
    );

    // Ajuste la limite selon le nombre de combinaisons
    let maxBuilds;
    if (totalCombinations > 100000) {
      maxBuilds = 15; // Beaucoup d'armure = plus de builds à tester
    } else if (totalCombinations > 10000) {
      maxBuilds = 25;
    } else {
      maxBuilds = Math.min(50, totalCombinations); // Teste tous si peu d'options
    }

    console.log(`🎯 Générera maximum ${maxBuilds} builds`);

    // ⭐ STRATÉGIE DE SAMPLING pour les grandes collections
    const samplePieces = (pieces, maxSample = 10) => {
      if (pieces.length <= maxSample) return pieces;

      // Prend les meilleurs + quelques aléatoires
      const topPieces = pieces.slice(0, Math.ceil(maxSample * 0.7));
      const randomPieces = pieces
        .slice(topPieces.length)
        .sort(() => Math.random() - 0.5)
        .slice(0, maxSample - topPieces.length);

      return [...topPieces, ...randomPieces];
    };

    // Échantillonne si nécessaire
    const sampledHelmet = samplePieces(helmet, 8);
    const sampledGauntlets = samplePieces(gauntlets, 8);
    const sampledChest = samplePieces(chest, 8);
    const sampledLegs = samplePieces(legs, 8);
    const sampledClassItem = samplePieces(classItem, 8);

    console.log("🎲 Échantillons:", {
      helmet: `${sampledHelmet.length}/${helmet.length}`,
      gauntlets: `${sampledGauntlets.length}/${gauntlets.length}`,
      chest: `${sampledChest.length}/${chest.length}`,
      legs: `${sampledLegs.length}/${legs.length}`,
      classItem: `${sampledClassItem.length}/${classItem.length}`,
    });

    let buildCount = 0;

    // Génération avec échantillons
    sampledHelmet.forEach((h) => {
      sampledGauntlets.forEach((g) => {
        sampledChest.forEach((c) => {
          sampledLegs.forEach((l) => {
            sampledClassItem.forEach((ci) => {
              if (buildCount >= maxBuilds) return;

              const buildSignature = `${h.itemHash}-${g.itemHash}-${c.itemHash}-${l.itemHash}-${ci.itemHash}`;

              if (seenBuilds.has(buildSignature)) return;
              seenBuilds.add(buildSignature);

              // Calcule les stats plus efficacement
              const totalStats = {};
              Object.keys(priorities).forEach((statHash) => {
                totalStats[statHash] =
                  (h.stats?.[statHash] || 0) +
                  (g.stats?.[statHash] || 0) +
                  (c.stats?.[statHash] || 0) +
                  (l.stats?.[statHash] || 0) +
                  (ci.stats?.[statHash] || 0);
              });

              const score = calculateBuildScore(totalStats, priorities);

              builds.push({
                helmet: h,
                gauntlets: g,
                chest: c,
                legs: l,
                classItem: ci,
                totalStats,
                score,
                signature: buildSignature,
              });

              buildCount++;
            });
          });
        });
      });
    });

    console.log(
      `🏗️ ${builds.length} builds générés sur ${buildCount} tentatives`
    );

    // Tri et retour des meilleurs
    return builds.sort((a, b) => b.score - a.score).slice(0, 15);
  };

  // ⭐ NOUVELLE FONCTION - Build vraiment équilibré :
  const generateTrulyBalancedBuild = (armorPieces, priorities) => {
    const balancedBuild = {
      name: "⚖️ Build Équilibré",
      description: "Évite les stats trop hautes ou trop basses",
      pieces: {},
      totalStats: {},
      score: 0,
    };

    // Objectif: toutes les stats entre 60-80
    const targetRange = { min: 60, max: 80 };
    const currentStats = {
      ...Object.fromEntries(Object.keys(statDefinitions).map((k) => [k, 0])),
    };

    // Algorithme de sélection progressive
    Object.entries(armorPieces).forEach(([slot, pieces]) => {
      if (pieces.length === 0) return;

      let bestPiece = pieces[0];
      let bestVariance = Infinity;

      // Teste chaque pièce et trouve celle qui minimise la variance
      pieces.forEach((piece) => {
        const testStats = { ...currentStats };

        // Simule l'ajout de cette pièce
        if (piece.stats) {
          Object.entries(piece.stats).forEach(([statHash, value]) => {
            testStats[statHash] += value;
          });
        }

        // Calcule la variance par rapport à la cible
        const variance = Object.values(testStats).reduce((acc, stat) => {
          const distance = Math.abs(stat - 70); // Cible 70
          return acc + distance * distance;
        }, 0);

        if (variance < bestVariance) {
          bestVariance = variance;
          bestPiece = piece;
        }
      });

      balancedBuild.pieces[slot] = bestPiece;

      // Met à jour les stats courantes
      if (bestPiece.stats) {
        Object.entries(bestPiece.stats).forEach(([statHash, value]) => {
          currentStats[statHash] += value;
        });
      }
    });

    balancedBuild.totalStats = calculateBuildStats(balancedBuild.pieces);

    // Score spécial pour l'équilibre
    balancedBuild.score = calculateBalancedScore(balancedBuild.totalStats);

    return balancedBuild;
  };

  // ⭐ NOUVELLE FONCTION - Build tiers élevés différent :
  const generateTrulyHighTierBuild = (armorPieces, priorities) => {
    const highTierBuild = {
      name: "🎯 Build Tiers Élevés",
      description: "Maximise les stats T8+ même si d'autres sont faibles",
      pieces: {},
      totalStats: {},
      score: 0,
    };

    // Stratégie: priorise 2-3 stats principales et sacrifie les autres
    const priorityStats = Object.entries(priorities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([statHash]) => statHash);

    console.log("🎯 Stats prioritaires:", priorityStats);

    Object.entries(armorPieces).forEach(([slot, pieces]) => {
      if (pieces.length === 0) return;

      let bestPiece = pieces[0];
      let bestPriorityScore = 0;

      pieces.forEach((piece) => {
        if (!piece.stats) return;

        // Score basé UNIQUEMENT sur les stats prioritaires
        let priorityScore = 0;
        priorityStats.forEach((statHash) => {
          const value = piece.stats[statHash] || 0;
          // Bonus exponentiel pour les hautes valeurs
          if (value >= 20) priorityScore += value * 3;
          else if (value >= 15) priorityScore += value * 2;
          else if (value >= 10) priorityScore += value * 1.5;
          else priorityScore += value;
        });

        if (priorityScore > bestPriorityScore) {
          bestPriorityScore = priorityScore;
          bestPiece = piece;
        }
      });

      highTierBuild.pieces[slot] = bestPiece;
    });

    highTierBuild.totalStats = calculateBuildStats(highTierBuild.pieces);
    highTierBuild.score = calculateHighTierScore(
      highTierBuild.totalStats,
      priorityStats
    );

    return highTierBuild;
  };

  // ⭐ NOUVELLES FONCTIONS DE SCORE :
  const calculateBalancedScore = (stats) => {
    const values = Object.values(stats);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    // Pénalise les extrêmes
    const variance =
      values.reduce((acc, val) => {
        return acc + Math.pow(val - avg, 2);
      }, 0) / values.length;

    // Score = moyenne - pénalité de variance
    return Math.round(avg * 10 - variance);
  };

  const calculateHighTierScore = (stats, priorityStats) => {
    let score = 0;

    priorityStats.forEach((statHash) => {
      const value = stats[statHash] || 0;
      const tier = Math.floor(value / 10);

      // Bonus exponentiel pour les tiers élevés
      if (tier >= 10) score += 200;
      else if (tier >= 9) score += 150;
      else if (tier >= 8) score += 100;
      else if (tier >= 7) score += 50;
      else score += tier * 5;
    });

    // Bonus si on a plusieurs T10
    const t10Count = priorityStats.filter((statHash) => {
      const tier = Math.floor((stats[statHash] || 0) / 10);
      return tier >= 10;
    }).length;

    if (t10Count >= 2) score += 300;
    else if (t10Count >= 1) score += 100;

    return Math.round(score);
  };

  // ⭐ AMÉLIORE AUSSI LA FONCTION calculateBuildStats pour inclure les mods :
  const calculateBuildStats = (pieces, modConfiguration = {}) => {
    const totalStats = {};

    // Stats de base du personnage
    Object.keys(statDefinitions).forEach((statHash) => {
      totalStats[statHash] = characterStats?.[statHash] || 0;
    });

    // Stats des pièces d'armure
    Object.values(pieces).forEach((piece) => {
      if (piece && piece.stats) {
        Object.entries(piece.stats).forEach(([statHash, value]) => {
          if (statDefinitions[statHash]) {
            totalStats[statHash] = (totalStats[statHash] || 0) + (value || 0);
          }
        });
      }
    });

    // 🔥 TODO: Ajouter les mods d'armure ici
    // Chaque pièce peut avoir des mods qui donnent +10 à une stat
    // Pour l'instant, on simule des mods optimaux
    Object.values(pieces).forEach((piece) => {
      if (piece && piece.details) {
        // Simule 1 mod de +10 sur la stat la plus prioritaire pour cette pièce
        const pieceStats = Object.entries(piece.stats || {});
        if (pieceStats.length > 0) {
          const highestStat = pieceStats.reduce((max, [hash, value]) =>
            value > (max[1] || 0) ? [hash, value] : max
          );

          if (highestStat[0] && statDefinitions[highestStat[0]]) {
            totalStats[highestStat[0]] += 10; // Mod simulé
          }
        }
      }
    });

    return totalStats;
  };

  // Applique un build
  const applyBuild = (build) => {
    setCurrentBuild(build);
    // Ici tu pourrais ajouter la logique pour appliquer le build en jeu
    console.log("🎮 Application du build:", build.name);
  };

  // Fonction pour obtenir la couleur de rareté
  const getRarityColor = (tierType) => {
    const colors = {
      2: "#ffffff",
      3: "#1eac20",
      4: "#5076a3",
      5: "#522f65",
      6: "#ceae33",
    };
    return colors[tierType] || "#ffffff";
  };

  // ⭐ FONCTION HELPER pour les noms de stats
  const getStatName = (statHash) => {
    return statDefinitions[statHash]?.name || `Stat ${statHash}`;
  };

  // ⭐ FONCTION HELPER pour les mods
  const getModTypeForStat = (statHash) => {
    const modMap = {
      2996146975: "mobility",
      392767087: "resilience",
      1943323491: "recovery",
      1735777505: "discipline",
      144602215: "intellect",
      4244567218: "strength",
    };
    return modMap[statHash] || "mobility";
  };

  return (
    <div className="build-optimizer">
      {/* Header de l'optimisateur */}
      <div className="optimizer-header">
        <div className="optimizer-title-card">
          <h2>🎯 Optimisateur de Build</h2>
          <p>Trouve automatiquement les meilleures combinaisons d'armure</p>
        </div>

        {/* Sélection de l'objectif */}
        <div className="goal-selector">
          <h3>🎲 Objectif du Build</h3>
          <div className="goals-grid">
            {Object.entries(buildGoals).map(([goalId, goal]) => (
              <button
                key={goalId}
                onClick={() => setSelectedGoal(goalId)}
                className={`goal-card ${
                  selectedGoal === goalId ? "active" : ""
                }`}
              >
                <div className="goal-header">
                  <span className="goal-name">{goal.name}</span>
                </div>
                <p className="goal-description">{goal.description}</p>

                {/* Aperçu des priorités */}
                <div className="goal-priorities">
                  {Object.entries(goal.priorities)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([statHash, priority]) => (
                      <div key={statHash} className="priority-stat">
                        <span
                          className="stat-icon"
                          style={{ color: statDefinitions[statHash]?.color }}
                        >
                          {statDefinitions[statHash]?.icon}
                        </span>
                        <span className="priority-value">{priority}</span>
                      </div>
                    ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bouton d'optimisation */}
        <div className="optimize-controls">
          <button
            onClick={optimizeBuild}
            disabled={loadingOptimization}
            className="optimize-btn"
          >
            {loadingOptimization ? (
              <>🔄 Optimisation en cours...</>
            ) : (
              <>🚀 Optimiser le Build</>
            )}
          </button>
        </div>
      </div>

      {/* Résultats de l'optimisation */}
      {loadingOptimization ? (
        <div className="optimization-loading">
          <h3>🧮 Calcul des combinaisons optimales...</h3>
          <div className="loading-steps">
            <div className="loading-step">📦 Analyse de l'inventaire</div>
            <div className="loading-step">📊 Calcul des statistiques</div>
            <div className="loading-step">🎯 Optimisation selon l'objectif</div>
            <div className="loading-step">🏆 Génération des builds</div>
          </div>
        </div>
      ) : optimizedBuilds.length > 0 ? (
        <div className="optimization-results">
          <h3>🏆 Builds Optimisés</h3>

          <div className="builds-grid">
            {optimizedBuilds.map((build, index) => (
              <div
                key={`build-${index}-${build.signature || index}`}
                className="build-card"
              >
                <div className="build-header">
                  <h4>Build #{index + 1}</h4>
                  <div className="build-score">
                    Score:{" "}
                    <span className="score-value">{build.score || 0}</span>
                  </div>
                  {/* ⭐ DEBUG: AFFICHE LA SIGNATURE */}
                  <div
                    className="build-signature"
                    style={{ fontSize: "10px", color: "#666" }}
                  >
                    {(build.signature || "no-sig").substring(0, 20)}...
                  </div>
                </div>

                {/* Stats du build */}
                <div className="build-stats">
                  <h5>📊 Statistiques finales</h5>
                  <div className="build-stats-grid">
                    {Object.entries(statDefinitions).map(([statHash, def]) => {
                      const value =
                        (build.totalStats && build.totalStats[statHash]) || 0; // ⭐ SÉCURISÉ
                      const tier = Math.floor(value / 10);

                      return (
                        <div key={statHash} className="build-stat">
                          <span
                            className="stat-icon"
                            style={{ color: def.color }}
                          >
                            {def.icon}
                          </span>
                          <span className="stat-name">{def.name}</span>
                          <span className="stat-value">{value}</span>
                          <span
                            className="stat-tier"
                            style={{ color: def.color }}
                          >
                            T{tier}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pièces du build */}
                <div className="build-pieces">
                  <h5>🛡️ Équipement requis</h5>
                  <div className="build-pieces-grid">
                    {build.helmet && (
                      <div className="build-piece">
                        <img
                          src={`https://www.bungie.net${
                            build.helmet.details?.displayProperties?.icon ||
                            build.helmet.details?.icon ||
                            ""
                          }`}
                          alt={
                            build.helmet.details?.displayProperties?.name ||
                            build.helmet.details?.name ||
                            "Casque"
                          }
                          className="armor-icon"
                          onError={(e) => {
                            console.log(
                              "❌ Erreur image casque:",
                              e.target.src
                            );
                            console.log("Details:", build.helmet.details);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "inline";
                          }}
                        />
                        <span
                          className="armor-icon-fallback"
                          style={{ display: "none" }}
                        >
                          🪖
                        </span>
                        <span className="armor-name">
                          {build.helmet.details?.displayProperties?.name ||
                            build.helmet.details?.name ||
                            "Casque"}
                        </span>
                      </div>
                    )}

                    {build.gauntlets && (
                      <div className="build-piece">
                        <img
                          src={`https://www.bungie.net${
                            build.gauntlets.details?.displayProperties?.icon ||
                            build.gauntlets.details?.icon ||
                            ""
                          }`}
                          alt={
                            build.gauntlets.details?.displayProperties?.name ||
                            build.gauntlets.details?.name ||
                            "Gantelets"
                          }
                          className="armor-icon"
                          onError={(e) => {
                            console.log(
                              "❌ Erreur image gantelets:",
                              e.target.src
                            );
                            console.log("Details:", build.gauntlets.details);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "inline";
                          }}
                        />
                        <span
                          className="armor-icon-fallback"
                          style={{ display: "none" }}
                        >
                          🥊
                        </span>
                        <span className="armor-name">
                          {build.gauntlets.details?.displayProperties?.name ||
                            build.gauntlets.details?.name ||
                            "Gantelets"}
                        </span>
                      </div>
                    )}

                    {build.chest && (
                      <div className="build-piece">
                        <img
                          src={`https://www.bungie.net${
                            build.chest.details?.displayProperties?.icon ||
                            build.chest.details?.icon ||
                            ""
                          }`}
                          alt={
                            build.chest.details?.displayProperties?.name ||
                            build.chest.details?.name ||
                            "Plastron"
                          }
                          className="armor-icon"
                          onError={(e) => {
                            console.log(
                              "❌ Erreur image plastron:",
                              e.target.src
                            );
                            console.log("Details:", build.chest.details);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "inline";
                          }}
                        />
                        <span
                          className="armor-icon-fallback"
                          style={{ display: "none" }}
                        >
                          🦺
                        </span>
                        <span className="armor-name">
                          {build.chest.details?.displayProperties?.name ||
                            build.chest.details?.name ||
                            "Plastron"}
                        </span>
                      </div>
                    )}

                    {build.legs && (
                      <div className="build-piece">
                        <img
                          src={`https://www.bungie.net${
                            build.legs.details?.displayProperties?.icon ||
                            build.legs.details?.icon ||
                            ""
                          }`}
                          alt={
                            build.legs.details?.displayProperties?.name ||
                            build.legs.details?.name ||
                            "Jambières"
                          }
                          className="armor-icon"
                          onError={(e) => {
                            console.log(
                              "❌ Erreur image jambières:",
                              e.target.src
                            );
                            console.log("Details:", build.legs.details);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "inline";
                          }}
                        />
                        <span
                          className="armor-icon-fallback"
                          style={{ display: "none" }}
                        >
                          👖
                        </span>
                        <span className="armor-name">
                          {build.legs.details?.displayProperties?.name ||
                            build.legs.details?.name ||
                            "Jambières"}
                        </span>
                      </div>
                    )}

                    {build.classItem && (
                      <div className="build-piece">
                        <img
                          src={`https://www.bungie.net${
                            build.classItem.details?.displayProperties?.icon ||
                            build.classItem.details?.icon ||
                            ""
                          }`}
                          alt={
                            build.classItem.details?.displayProperties?.name ||
                            build.classItem.details?.name ||
                            "Marque"
                          }
                          className="armor-icon"
                          onError={(e) => {
                            console.log(
                              "❌ Erreur image marque:",
                              e.target.src
                            );
                            console.log("Details:", build.classItem.details);
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "inline";
                          }}
                        />
                        <span
                          className="armor-icon-fallback"
                          style={{ display: "none" }}
                        >
                          🎭
                        </span>
                        <span className="armor-name">
                          {build.classItem.details?.displayProperties?.name ||
                            build.classItem.details?.name ||
                            "Marque"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-optimization">
          <h3>🎯 Prêt à optimiser</h3>
          <p>
            Sélectionnez un objectif et cliquez sur "Optimiser" pour commencer
          </p>
        </div>
      )}

      {/* Build actuellement appliqué */}
      {currentBuild && (
        <div className="current-build">
          <h3>⚡ Build Actuel</h3>
          <div className="current-build-summary">
            <span className="current-build-name">{currentBuild.name}</span>
            <span className="current-build-score">
              Score: {currentBuild.score}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildOptimizer;

// ⭐ NOUVEAUX TYPES DE MODS D'ARMURE
const armorMods = {
  // Mods de stats (+10 chacun)
  mobility: {
    name: "Mod de Mobilité",
    statBoost: { 2996146975: 10 },
    cost: 3,
    slot: "combat",
  },
  resilience: {
    name: "Mod de Résilience",
    statBoost: { 392767087: 10 },
    cost: 3,
    slot: "combat",
  },
  recovery: {
    name: "Mod de Récupération",
    statBoost: { 1943323491: 10 },
    cost: 4,
    slot: "combat",
  },
  discipline: {
    name: "Mod de Discipline",
    statBoost: { 1735777505: 10 },
    cost: 3,
    slot: "combat",
  },
  intellect: {
    name: "Mod d'Intelligence",
    statBoost: { 144602215: 10 },
    cost: 5,
    slot: "combat",
  },
  strength: {
    name: "Mod de Force",
    statBoost: { 4244567218: 10 },
    cost: 3,
    slot: "combat",
  },

  // ⭐ MODS SPÉCIAUX avec bonus multiples
  powerful_friends: {
    name: "Amis Puissants",
    statBoost: { 2996146975: 20 }, // +20 Mobilité !
    cost: 4,
    slot: "combat",
    requirements: "Mod CWL sur une autre pièce",
  },
  radiant_light: {
    name: "Lumière Radieuse",
    statBoost: { 4244567218: 20 }, // +20 Force !
    cost: 4,
    slot: "combat",
    requirements: "Mod CWL sur une autre pièce",
  },
};

// ⭐ NOUVEAU SYSTÈME D'OPTIMISATION DES MODS
const optimizeModsForBuild = (pieces, targetStats, priorities) => {
  console.log("🔧 === OPTIMISATION DES MODS ===");
  console.log("Stats cibles:", targetStats);
  console.log("Priorités:", priorities);

  const modConfiguration = {};
  const baseStats = {};

  // 1. Calcule les stats de base (sans mods)
  Object.keys(statDefinitions).forEach((statHash) => {
    baseStats[statHash] = 0;
  });

  Object.values(pieces).forEach((piece) => {
    if (piece?.stats) {
      Object.entries(piece.stats).forEach(([statHash, value]) => {
        if (statDefinitions[statHash]) {
          baseStats[statHash] += value;
        }
      });
    }
  });

  console.log("📊 Stats de base (sans mods):", baseStats);

  // 2. Calcule les déficits par rapport aux cibles
  const deficits = {};
  Object.entries(targetStats || {}).forEach(([statHash, target]) => {
    const current = baseStats[statHash] || 0;
    const deficit = Math.max(0, target - current);
    deficits[statHash] = deficit;
  });

  console.log("📉 Déficits à combler:", deficits);

  // 3. Attribution intelligente des mods
  Object.entries(pieces).forEach(([slot, piece]) => {
    if (!piece) return;

    modConfiguration[slot] = [];

    // Simule 5 slots de mods par pièce (réaliste pour armure masterwork)
    const availableSlots = 5;
    let energyBudget = 10; // Énergie max par pièce

    // ⭐ STRATÉGIE 1: Combler les plus gros déficits d'abord
    const sortedDeficits = Object.entries(deficits)
      .filter(([_, deficit]) => deficit > 0)
      .sort(([hashA, deficitA], [hashB, deficitB]) => {
        // Trie par priorité ET par déficit
        const priorityA = priorities[hashA] || 0;
        const priorityB = priorities[hashB] || 0;
        return priorityB * deficitB - priorityA * deficitA;
      });

    let slotsUsed = 0;

    sortedDeficits.forEach(([statHash, deficit]) => {
      if (slotsUsed >= availableSlots || energyBudget < 3) return;

      // Détermine combien de mods +10 on peut mettre
      const modsNeeded = Math.ceil(deficit / 10);
      const modsAffordable = Math.min(
        modsNeeded,
        availableSlots - slotsUsed,
        Math.floor(energyBudget / 3) // Coût moyen 3-5 énergie
      );

      if (modsAffordable > 0) {
        const modType = getModTypeForStat(statHash);

        for (let i = 0; i < modsAffordable; i++) {
          modConfiguration[slot].push({
            type: modType,
            statBoost: { [statHash]: 10 },
            cost: 3,
          });

          deficits[statHash] = Math.max(0, deficits[statHash] - 10);
          energyBudget -= 3;
          slotsUsed++;
        }

        console.log(
          `🔧 ${slot}: +${modsAffordable * 10} ${getStatName(statHash)}`
        );
      }
    });

    // ⭐ STRATÉGIE 2: Remplir les slots restants avec les stats prioritaires
    while (slotsUsed < availableSlots && energyBudget >= 3) {
      // Trouve la stat avec la plus haute priorité
      const topPriorityStat = Object.entries(priorities).sort(
        ([, a], [, b]) => b - a
      )[0];

      if (topPriorityStat) {
        const [statHash] = topPriorityStat;
        const modType = getModTypeForStat(statHash);

        modConfiguration[slot].push({
          type: modType,
          statBoost: { [statHash]: 10 },
          cost: 3,
        });

        energyBudget -= 3;
        slotsUsed++;

        console.log(`🔧 ${slot}: +10 ${getStatName(statHash)} (remplissage)`);
      } else {
        break;
      }
    }
  });

  console.log("🔧 Configuration finale des mods:", modConfiguration);
  console.log("=== FIN OPTIMISATION MODS ===\n");

  return modConfiguration;
};

// ⭐ REMPLACE calculateBuildStats avec support des mods
const calculateBuildStats = (pieces, modConfiguration = {}) => {
  const totalStats = {};

  // Initialise avec les stats de base du personnage
  Object.keys(statDefinitions).forEach((statHash) => {
    totalStats[statHash] = 0; // Stats de base à 0, armure apporte tout
  });

  // 1. Stats des pièces d'armure
  Object.values(pieces).forEach((piece) => {
    if (piece?.stats) {
      Object.entries(piece.stats).forEach(([statHash, value]) => {
        if (statDefinitions[statHash]) {
          totalStats[statHash] += value || 0;
        }
      });
    }
  });

  console.log("📊 Stats après armure:", { ...totalStats });

  // 2. ⭐ Stats des MODS (le gros bonus !)
  Object.entries(modConfiguration).forEach(([slot, mods]) => {
    if (Array.isArray(mods)) {
      mods.forEach((mod) => {
        if (mod.statBoost) {
          Object.entries(mod.statBoost).forEach(([statHash, boost]) => {
            if (statDefinitions[statHash]) {
              totalStats[statHash] += boost;
              console.log(`🔧 Mod ${slot}: +${boost} ${getStatName(statHash)}`);
            }
          });
        }
      });
    }
  });

  console.log("📊 Stats FINALES (armure + mods):", { ...totalStats });

  return totalStats;
};

// ⭐ MISE À JOUR de generateOptimalBuilds avec mods
const generateOptimalBuilds = (armorPieces, priorities, targets = {}) => {
  console.log("🎯 Génération des builds optimaux AVEC MODS...");

  const { helmet, gauntlets, chest, legs, classItem } = armorPieces;

  // Vérifications de base...
  const slotsAvailable = {
    helmet: helmet.length,
    gauntlets: gauntlets.length,
    chest: chest.length,
    legs: legs.length,
    classItem: classItem.length,
  };

  console.log("📊 Pièces disponibles par slot:", slotsAvailable);

  const missingSlots = Object.entries(slotsAvailable)
    .filter(([slot, count]) => count === 0)
    .map(([slot]) => slot);

  if (missingSlots.length > 0) {
    console.log("❌ Slots manquants:", missingSlots);
    return [
      {
        name: "⚠️ Build incomplet",
        description: `Manque: ${missingSlots.join(", ")}`,
        totalStats: {},
        score: 0,
        incomplete: true,
        missingSlots,
      },
    ];
  }

  const builds = [];
  const seenBuilds = new Set();

  // Échantillonnage plus large pour les mods
  const samplePieces = (pieces, maxSample = 12) => {
    if (pieces.length <= maxSample) return pieces;

    const topPieces = pieces.slice(0, Math.ceil(maxSample * 0.6));
    const randomPieces = pieces
      .slice(topPieces.length)
      .sort(() => Math.random() - 0.5)
      .slice(0, maxSample - topPieces.length);

    return [...topPieces, ...randomPieces];
  };

  const sampledHelmet = samplePieces(helmet, 12);
  const sampledGauntlets = samplePieces(gauntlets, 12);
  const sampledChest = samplePieces(chest, 12);
  const sampledLegs = samplePieces(legs, 12);
  const sampledClassItem = samplePieces(classItem, 12);

  let maxBuilds = 30; // ⬆️ Plus de builds car mods donnent plus d'options
  let buildCount = 0;

  console.log("🎲 Génération avec mods optimisés...");

  // Génération avec mods automatiques
  sampledHelmet.forEach((h) => {
    sampledGauntlets.forEach((g) => {
      sampledChest.forEach((c) => {
        sampledLegs.forEach((l) => {
          sampledClassItem.forEach((ci) => {
            if (buildCount >= maxBuilds) return;

            const buildSignature = `${h.itemHash}-${g.itemHash}-${c.itemHash}-${l.itemHash}-${ci.itemHash}`;
            if (seenBuilds.has(buildSignature)) return;
            seenBuilds.add(buildSignature);

            const pieces = {
              helmet: h,
              gauntlets: g,
              chest: c,
              legs: l,
              classItem: ci,
            };

            // ⭐ CALCULE LES CIBLES INTELLIGENTES basées sur les priorités
            const intelligentTargets = {};
            Object.entries(priorities).forEach(([statHash, priority]) => {
              if (priority >= 90) intelligentTargets[statHash] = 100; // T10
              else if (priority >= 80) intelligentTargets[statHash] = 80; // T8
              else if (priority >= 70) intelligentTargets[statHash] = 70; // T7
              else if (priority >= 60) intelligentTargets[statHash] = 60; // T6
              else intelligentTargets[statHash] = 50; // T5 minimum
            });

            // ⭐ OPTIMISE LES MODS pour ce build
            const modConfiguration = optimizeModsForBuild(
              pieces,
              intelligentTargets,
              priorities
            );

            // ⭐ CALCULE LES STATS FINALES (armure + mods)
            const totalStats = calculateBuildStats(pieces, modConfiguration);

            // ⭐ NOUVEAU SCORE qui récompense l'atteinte des cibles
            const score = calculateEnhancedBuildScore(
              totalStats,
              priorities,
              intelligentTargets
            );

            builds.push({
              helmet: h,
              gauntlets: g,
              chest: c,
              legs: l,
              classItem: ci,
              totalStats,
              modConfiguration, // ⭐ NOUVEAU: inclut la config des mods
              score,
              signature: buildSignature,
              targets: intelligentTargets, // ⭐ Pour debug
            });

            buildCount++;
          });
        });
      });
    });
  });

  console.log(`🏗️ ${builds.length} builds générés avec mods optimisés`);

  // ⭐ AFFICHE LES MEILLEURS BUILDS
  const topBuilds = builds.sort((a, b) => b.score - a.score).slice(0, 5);

  console.log("🏆 Top 3 builds avec mods:");
  topBuilds.slice(0, 3).forEach((build, i) => {
    console.log(`  ${i + 1}. Score: ${build.score}`);
    Object.entries(build.totalStats).forEach(([statHash, value]) => {
      const tier = Math.floor(value / 10);
      if (tier >= 8) {
        console.log(`     ${getStatName(statHash)}: ${value} (T${tier}) ⭐`);
      }
    });
  });

  return topBuilds;
};

// ⭐ NOUVEAU SYSTÈME DE SCORE AMÉLIORÉ
const calculateEnhancedBuildScore = (stats, priorities, targets = {}) => {
  console.log("🧮 === CALCUL SCORE AVEC MODS ===");

  let score = 0;
  let targetHits = 0;
  let t10Count = 0;
  let t8PlusCount = 0;

  Object.entries(priorities).forEach(([statHash, priority]) => {
    const statValue = stats[statHash] || 0;
    const tier = Math.floor(statValue / 10);
    const target = targets[statHash] || 50;

    console.log(
      `📊 ${getStatName(statHash)}: ${statValue} (T${tier}) - Cible: ${target}`
    );

    // ⭐ SCORE DE BASE exponentiel pour les hauts tiers
    let baseScore = 0;
    if (tier >= 10) {
      baseScore = 150; // T10 = énorme bonus !
      t10Count++;
    } else if (tier >= 9) {
      baseScore = 120;
    } else if (tier >= 8) {
      baseScore = 90;
      t8PlusCount++;
    } else if (tier >= 7) {
      baseScore = 60;
    } else if (tier >= 6) {
      baseScore = 35;
    } else if (tier >= 5) {
      baseScore = 20;
    } else {
      baseScore = tier * 3;
    }

    // Pondération par priorité
    const weightedScore = baseScore * (priority / 100);
    score += weightedScore;

    // ⭐ BONUS pour atteindre la cible
    if (statValue >= target) {
      const targetBonus = 50 * (priority / 100);
      score += targetBonus;
      targetHits++;
      console.log(`  ✅ Cible atteinte! Bonus: +${targetBonus}`);
    }

    console.log(`  Score: ${baseScore} × ${priority / 100} = ${weightedScore}`);
  });

  // ⭐ BONUS COMBO massifs
  let comboBonus = 0;

  if (t10Count >= 3) comboBonus += 500; // 3× T10 = build de rêve !
  else if (t10Count >= 2) comboBonus += 300; // 2× T10 = excellent
  else if (t10Count >= 1) comboBonus += 150; // 1× T10 = très bon

  if (t8PlusCount >= 4) comboBonus += 200; // Beaucoup de hauts tiers
  else if (t8PlusCount >= 2) comboBonus += 100;

  if (targetHits >= 5) comboBonus += 200; // Toutes les cibles atteintes
  else if (targetHits >= 4) comboBonus += 100;

  const finalScore = Math.round(score + comboBonus);

  console.log(`💯 RÉSULTAT FINAL:`);
  console.log(`  Score base: ${Math.round(score)}`);
  console.log(`  T10 × ${t10Count}, T8+ × ${t8PlusCount}`);
  console.log(`  Cibles atteintes: ${targetHits}/6`);
  console.log(`  Bonus combo: +${comboBonus}`);
  console.log(`  SCORE FINAL: ${finalScore}`);
  console.log("=== FIN CALCUL ===\n");

  return finalScore;
};
