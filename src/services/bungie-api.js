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

// Fonction pour récupérer le manifest (base de données) avec retry
export const getManifest = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve) => setTimeout(resolve, i * 1000)); // Délai progressif

      const response = await fetch(`${BUNGIE_BASE_URL}/Destiny2/Manifest/`, {
        headers,
      });

      if (!response.ok) {
        if (i === retries - 1) return null; // Dernier essai
        continue; // Retry
      }

      const data = await response.json();
      return data.Response;
    } catch (error) {
      if (i === retries - 1) return null; // Dernier essai
      continue; // Retry
    }
  }
  return null;
};

// Variables pour stocker le manifest téléchargé
let manifestData = null;
let manifestPromise = null;

// Fonction pour télécharger et parser le manifest
export const downloadManifest = async () => {
  if (manifestPromise) {
    return manifestPromise;
  }

  if (manifestData) {
    return manifestData;
  }

  manifestPromise = (async () => {
    try {
      const manifest = await getManifest();
      if (!manifest) {
        throw new Error("Impossible de récupérer le manifest");
      }

      const manifestUrl =
        manifest.jsonWorldContentPaths?.fr ||
        manifest.jsonWorldContentPaths?.en;

      if (!manifestUrl) {
        throw new Error("URL du manifest non trouvée");
      }

      const response = await fetch(`${BUNGIE_ROOT_URL}${manifestUrl}`);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} lors du téléchargement du manifest`
        );
      }

      const data = await response.json();
      manifestData = data;
      return data;
    } catch (error) {
      manifestPromise = null;
      manifestData = null;
      throw error;
    }
  })();

  return manifestPromise;
};

// Fonction pour récupérer un item depuis le manifest local
export const getItemDefinition = async (itemHash) => {
  try {
    if (!manifestData) {
      await downloadManifest();
    }

    if (!manifestData?.DestinyInventoryItemDefinition) {
      return null;
    }

    const item =
      manifestData.DestinyInventoryItemDefinition[itemHash.toString()];
    return item || null;
  } catch (error) {
    return null;
  }
};

// Fonction pour tester plusieurs hash
export const testMultipleHashes = async (hashList) => {
  const results = [];

  for (const { name, hash } of hashList) {
    try {
      const item = await getItemDefinition(hash);
      if (item?.displayProperties) {
        results.push({
          name,
          hash,
          found: true,
          actualName: item.displayProperties.name,
          icon: item.displayProperties.icon,
        });
      } else {
        results.push({
          name,
          hash,
          found: false,
        });
      }
    } catch (error) {
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
