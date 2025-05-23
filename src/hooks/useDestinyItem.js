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

        // Récupérer l'item depuis le manifest local uniquement
        const itemData = await getItemDefinition(itemHash);

        if (itemData && itemData.displayProperties) {
          const processedItem = {
            name: itemData.displayProperties.name,
            description: itemData.displayProperties.description,
            icon: getImageUrl(itemData.displayProperties.icon),
            hash: itemHash,
          };

          setItem(processedItem);
        } else {
          setError(`Item ${itemHash} non trouvé`);
        }
      } catch (err) {
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
        setManifestLoaded(false);
      } finally {
        setLoading(false);
      }
    };

    initManifest();
  }, []);

  return { manifestLoaded, loading };
};
