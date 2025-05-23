export const API_CONFIG = {
  DIM_BASE_URL: "https://data.destinysets.com/i/InventoryItem:",
  LIGHT_GG_BASE_URL: "https://www.light.gg/Content/Items/DestinyInventoryItemDefinition/",
  BUNGIE_BASE_URL: "https://www.bungie.net"
};

// Fonction helper pour générer les URLs d'images
export const getItemImage = (itemId, source = 'light.gg') => {
  switch(source) {
    case 'dim':
      return `${API_CONFIG.DIM_BASE_URL}${itemId}`;
    case 'light.gg':
      return `${API_CONFIG.LIGHT_GG_BASE_URL}${itemId}/icon.jpg`;
    default:
      return `${API_CONFIG.LIGHT_GG_BASE_URL}${itemId}/icon.jpg`;
  }
};