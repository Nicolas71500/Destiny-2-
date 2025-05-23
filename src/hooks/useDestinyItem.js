import { useState, useEffect } from "react";
import {
  getItemDefinition,
  getImageUrl,
  downloadManifest,
} from "../services/bungie-api";

export const useDestinyItem = (itemHash) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemHash) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`🎯 useDestinyItem - Recherche hash: ${itemHash}`);

        // Récupérer l'item depuis le manifest local uniquement
        const itemData = await getItemDefinition(itemHash);

        if (itemData && itemData.displayProperties) {
          const processedItem = {
            name: itemData.displayProperties.name,
            description: itemData.displayProperties.description,
            icon: getImageUrl(itemData.displayProperties.icon),
            hash: itemHash,
          };

          console.log(`✨ Item traité:`, processedItem.name);
          setItem(processedItem);
        } else {
          console.log(`❌ Aucune donnée valide pour l'item: ${itemHash}`);
          setError(`Item ${itemHash} non trouvé`);
        }
      } catch (err) {
        console.error(`💥 Erreur dans useDestinyItem pour ${itemHash}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemHash]);

  return { item, loading, error };
};

// Hook pour initialiser le manifest
export const useManifest = () => {
  const [manifestLoaded, setManifestLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initManifest = async () => {
      try {
        setLoading(true);
        await downloadManifest();
        setManifestLoaded(true);
      } catch (error) {
        console.error("Erreur lors de l'initialisation du manifest:", error);
      } finally {
        setLoading(false);
      }
    };

    initManifest();
  }, []);

  return { manifestLoaded, loading };
};
