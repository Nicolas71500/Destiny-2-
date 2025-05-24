const CLIENT_ID = process.env.REACT_APP_BUNGIE_CLIENT_ID;
// const API_KEY = process.env.REACT_APP_BUNGIE_API_KEY;
// console.log("API_KEY utilisée :", API_KEY);

const BUNGIE_API_BASE = "https://www.bungie.net/Platform";

const getBungieHeaders = (includeAuth = true) => {
  const headers = {
    // "X-API-Key": API_KEY,  // ← Supprime cette ligne
    "Content-Type": "application/json",
  };
  if (includeAuth) {
    const token = localStorage.getItem("bungie_access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

const getRedirectUri = () => {
  const currentUrl = window.location.origin;
  if (currentUrl.includes("vercel.app")) {
    return "https://destiny-2.vercel.app/auth/callback";
  }
  if (currentUrl.includes("127.0.0.1") || currentUrl.includes("localhost")) {
    return "https://127.0.0.1:3000/auth/callback";
  }
  return `${currentUrl}/auth/callback`;
};

export const MEMBERSHIP_TYPES = {
  NONE: 0,
  XBOX: 1,
  PSN: 2,
  STEAM: 3,
  BLIZZARD: 4,
  STADIA: 5,
  EPIC: 6,
  BUNGIE_NEXT: 254,
};

export const CHARACTER_CLASSES = {
  0: "Titan",
  1: "Chasseur",
  2: "Arcaniste",
};

export const CHARACTER_RACES = {
  0: "Humain",
  1: "Awoken",
  2: "Exo",
};

export const CHARACTER_GENDERS = {
  0: "Masculin",
  1: "Féminin",
};

export const getBungieAuthUrl = () => {
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem("oauth_state", state);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    state: state,
  });
  return `https://www.bungie.net/en/OAuth/Authorize?${params}`;
};

export const handleAuthCallback = async (code, state) => {
  const storedState = localStorage.getItem("oauth_state");
  if (state !== storedState) {
    throw new Error("État OAuth invalide - Possible attaque CSRF");
  }
  try {
    console.log("🔄 Échange du code avec backend...");
    const response = await fetch("https://127.0.0.1:3001/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code, clientId: CLIENT_ID }),
    });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      console.error("❌ Erreur backend:", errorData);
      throw new Error(errorData.error || "Erreur lors de l'échange de token");
    }
    
    const tokenData = await response.json();
    console.log("✅ Token obtenu via backend !", tokenData);
    
    const expirationTime = Date.now() + tokenData.expires_in * 1000;
    localStorage.setItem("bungie_access_token", tokenData.access_token);
    localStorage.setItem("bungie_membership_id", tokenData.membership_id);
    localStorage.setItem("bungie_token_type", tokenData.token_type);
    localStorage.setItem("bungie_token_expires", expirationTime.toString());
    localStorage.removeItem("oauth_state");
    
    return {
      accessToken: tokenData.access_token,
      membershipId: tokenData.membership_id,
      tokenType: tokenData.token_type,
      expiresAt: new Date(expirationTime),
    };
  } catch (error) {
    console.error("❌ Erreur échange token:", error);
    throw error;
  }
};

export const isTokenValid = () => {
  const token = localStorage.getItem("bungie_access_token");
  const expiresAt = localStorage.getItem("bungie_token_expires");
  
  if (!token || !expiresAt) {
    console.log("🔍 Token ou expiration manquant");
    return false;
  }
  
  const isExpired = Date.now() > parseInt(expiresAt) - 5 * 60 * 1000; // 5 min de marge
  if (isExpired) {
    console.log("⏰ Token expiré");
    return false;
  }
  
  console.log("✅ Token valide");
  return true;
};

export const clearAuthData = () => {
  localStorage.removeItem("bungie_access_token");
  localStorage.removeItem("bungie_membership_id");
  localStorage.removeItem("bungie_token_type");
  localStorage.removeItem("bungie_token_expires");
  localStorage.removeItem("oauth_state");
};

export const isAuthenticated = () => isTokenValid();
export const logout = () => clearAuthData();

export const getBungieProfile = async () => {
  if (!isTokenValid()) throw new Error("Token invalide ou expiré");
  try {
    const accessToken = localStorage.getItem("bungie_access_token");
    const response = await fetch("https://127.0.0.1:3001/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    if (!response.ok) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        throw new Error(
          `Erreur API Bungie: ${response.status} ${data.error || text}`
        );
      } catch {
        throw new Error(
          `Erreur API Bungie: ${response.status} (réponse non JSON)`
        );
      }
    }
    const data = await response.json();
    return {
      displayName: data.bungieNetUser.displayName,
      profilePicturePath: data.bungieNetUser.profilePicturePath,
      membershipId: data.bungieNetUser.membershipId,
      destinyMemberships: data.destinyMemberships,
      primaryMembershipId: data.primaryMembershipId,
    };
  } catch (error) {
    console.error("Erreur profil Bungie:", error);
    throw error;
  }
};

export async function getAllDestinyMemberships(accessToken) {
  // Vérifie que le token est valide avant l'appel
  if (!accessToken || !isTokenValid()) {
    throw new Error("Token invalide ou expiré");
  }
  
  const response = await fetch("https://127.0.0.1:3001/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      throw new Error(
        "Erreur API Bungie: " + response.status + " " + (data.error || text)
      );
    } catch {
      throw new Error(
        "Erreur API Bungie: " + response.status + " (réponse non JSON)"
      );
    }
  }
  return response.json();
}

export const getPlatformName = (membershipType) => {
  const platforms = {
    1: "Xbox",
    2: "PlayStation",
    3: "Steam",
    4: "Battle.net",
    5: "Stadia",
    6: "Epic Games",
    254: "Bungie.net",
  };
  return platforms[membershipType] || "Inconnu";
};

export const getDestinyProfileFromPlatform = async (
  membershipType,
  membershipId
) => {
  if (!isTokenValid()) throw new Error("Token invalide ou expiré");
  
  try {
    const accessToken = localStorage.getItem("bungie_access_token");
    console.log(`🎮 Récupération profil ${membershipType}/${membershipId}`);
    
    const response = await fetch("https://127.0.0.1:3001/api/destiny-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        accessToken, 
        membershipType, 
        membershipId 
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        throw new Error(`Erreur API Bungie: ${response.status} ${data.error || text}`);
      } catch {
        throw new Error(`Erreur API Bungie: ${response.status} (réponse non JSON)`);
      }
    }

    const data = await response.json();
    console.log("✅ Profil Destiny récupéré:", data);
    
    return data;
  } catch (error) {
    console.error("Erreur profil Destiny:", error);
    throw error;
  }
};

export const getUserInfo = () => {
  if (!isAuthenticated()) return null;
  return {
    displayName: "Chargement...",
    membershipId: localStorage.getItem("bungie_membership_id"),
    bungieNetUserInfo: {
      iconPath: "/img/theme/bungienet/icons/defaultAvatar.png",
    },
  };
};

export const getCharacterDetails = async (
  membershipType,
  destinyMembershipId,
  characterId
) => {
  if (!isTokenValid()) throw new Error("Token invalide ou expiré");
  try {
    const response = await fetch(
      `${BUNGIE_API_BASE}/Destiny2/${membershipType}/Profile/${destinyMembershipId}/Character/${characterId}/?components=200,201,205`,
      { headers: getBungieHeaders() }
    );
    if (!response.ok) {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        throw new Error(
          `Erreur API Bungie: ${response.status} ${data.Message || text}`
        );
      } catch {
        console.error("Réponse non JSON reçue :", text);
        throw new Error(
          `Erreur API Bungie: ${response.status} (réponse non JSON)`
        );
      }
    }
    const data = await response.json();
    if (data.ErrorCode !== 1) {
      throw new Error(`Erreur Bungie: ${data.Message}`);
    }
    return data.Response;
  } catch (error) {
    console.error("Erreur détails personnage:", error);
    throw error;
  }
};

/**
 * Retourne un tableau des personnages existants pour un profil Destiny.
 * @param {object} profile - L'objet retourné par getDestinyProfileFromPlatform
 * @returns {Array} Liste des personnages existants
 */
export const getExistingCharacters = (profile) => {
  if (
    profile &&
    profile.profile &&
    profile.profile.characters &&
    profile.profile.characters.data
  ) {
    return Object.values(profile.profile.characters.data);
  }
  return [];
};
