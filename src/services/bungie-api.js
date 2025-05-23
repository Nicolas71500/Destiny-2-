const BUNGIE_API_KEY = process.env.REACT_APP_BUNGIE_API_KEY;
const BUNGIE_BASE_URL = "https://www.bungie.net/Platform";
const BUNGIE_ROOT_URL = "https://www.bungie.net";

// Headers pour les requêtes
const headers = {
  "X-API-Key": BUNGIE_API_KEY,
  "Content-Type": "application/json",
};

// Fonction pour construire l'URL complète d'une image
export const getImageUrl = (iconPath) => {
  if (!iconPath) return null;
  return `${BUNGIE_ROOT_URL}${iconPath}`;
};

// Fonction pour récupérer le manifest (base de données)
export const getManifest = async () => {
  try {
    console.log("📡 Récupération du manifest...");
    const response = await fetch(`${BUNGIE_BASE_URL}/Destiny2/Manifest/`, {
      headers,
    });

    if (!response.ok) {
      console.error(`❌ Erreur HTTP ${response.status} pour le manifest`);
      return null;
    }

    const data = await response.json();
    console.log("✅ Manifest récupéré avec succès");
    return data.Response;
  } catch (error) {
    console.error("💥 Erreur lors de la récupération du manifest:", error);
    return null;
  }
};

// Variables pour stocker le manifest téléchargé
let manifestData = null;
let manifestPromise = null; // Pour éviter les téléchargements multiples

// Fonction pour télécharger et parser le manifest
export const downloadManifest = async () => {
  // Si déjà en cours de téléchargement, attendre le résultat
  if (manifestPromise) {
    console.log("⏳ Manifest déjà en cours de téléchargement...");
    return manifestPromise;
  }

  // Si déjà téléchargé, retourner les données
  if (manifestData) {
    console.log("✅ Manifest déjà disponible en cache");
    return manifestData;
  }

  // Créer la promesse de téléchargement
  manifestPromise = (async () => {
    try {
      const manifest = await getManifest();
      if (!manifest) {
        throw new Error("Impossible de récupérer le manifest");
      }

      // Récupérer l'URL du manifest français (ou anglais si pas disponible)
      const manifestUrl =
        manifest.jsonWorldContentPaths.fr || manifest.jsonWorldContentPaths.en;

      console.log(
        "📥 Téléchargement du manifest depuis:",
        `${BUNGIE_ROOT_URL}${manifestUrl}`
      );

      const response = await fetch(`${BUNGIE_ROOT_URL}${manifestUrl}`);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} lors du téléchargement du manifest`
        );
      }

      const data = await response.json();

      manifestData = data;
      const itemCount = Object.keys(
        data.DestinyInventoryItemDefinition || {}
      ).length;
      console.log(
        `🎯 Manifest téléchargé avec succès! ${itemCount} items disponibles`
      );

      return data;
    } catch (error) {
      console.error("💥 Erreur lors du téléchargement du manifest:", error);
      manifestPromise = null; // Reset pour pouvoir réessayer
      manifestData = null;
      throw error;
    }
  })();

  return manifestPromise;
};

// Fonction pour récupérer un item depuis le manifest local UNIQUEMENT
export const getItemDefinition = async (itemHash) => {
  try {
    console.log(`🔍 Recherche de l'item ${itemHash}`);

    // Assurer que le manifest est téléchargé
    if (!manifestData) {
      console.log("📥 Téléchargement du manifest requis...");
      await downloadManifest();
    }

    // Vérifier que le manifest est disponible
    if (!manifestData || !manifestData.DestinyInventoryItemDefinition) {
      console.error("❌ Manifest non disponible");
      return null;
    }

    // Chercher l'item dans le manifest local
    const item =
      manifestData.DestinyInventoryItemDefinition[itemHash.toString()];

    if (!item) {
      console.log(`❌ Item ${itemHash} non trouvé dans le manifest`);
      return null;
    }

    console.log(
      `✅ Item ${itemHash} trouvé: ${
        item.displayProperties?.name || "Nom indisponible"
      }`
    );
    return item;
  } catch (error) {
    console.error(
      `💥 Erreur lors de la récupération de l'item ${itemHash}:`,
      error
    );
    return null;
  }
};

// Fonction pour tester plusieurs hash et voir lesquels fonctionnent
export const testMultipleHashes = async (hashList) => {
  console.log("🧪 Test de plusieurs hash...");
  const results = [];

  for (const { name, hash } of hashList) {
    try {
      const item = await getItemDefinition(hash);
      if (item && item.displayProperties) {
        results.push({
          name,
          hash,
          found: true,
          actualName: item.displayProperties.name,
          icon: item.displayProperties.icon,
        });
        console.log(`✅ ${name} (${hash}): ${item.displayProperties.name}`);
      } else {
        results.push({
          name,
          hash,
          found: false,
        });
        console.log(`❌ ${name} (${hash}): Non trouvé`);
      }
    } catch (error) {
      console.log(`💥 ${name} (${hash}): Erreur - ${error.message}`);
      results.push({
        name,
        hash,
        found: false,
        error: error.message,
      });
    }
  }

  return results;
};
