import { useState, useEffect, useCallback } from "react";
import {
  getBungieProfile,
  getAllDestinyMemberships,
  getDestinyProfileFromPlatform,
  getCharacterDetails,
  isTokenValid,
  clearAuthData,
  handleAuthCallback,
  CHARACTER_CLASSES,
  CHARACTER_RACES,
  CHARACTER_GENDERS,
} from "../services/bungie-auth";

export const useBungieAuth = () => {
  const [user, setUser] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterDetails, setCharacterDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialiser l'authentification
  const initAuth = useCallback(async () => {
    console.log("🔄 Initialisation auth...");

    if (!isTokenValid()) {
      console.log("❌ Token invalide, pas connecté");
      setIsAuthenticated(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await loadUserData();
      console.log("✅ Auth initialisée avec succès");
      setIsAuthenticated(true); // ← Assure-toi que c'est bien défini
    } catch (error) {
      console.error("❌ Erreur init auth:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Charger toutes les données utilisateur
  const loadUserData = async () => {
    try {
      const profile = await getBungieProfile();
      console.log("👤 Profil utilisateur:", profile);

      if (profile.destinyMemberships && profile.destinyMemberships.length > 0) {
        console.log("🎮 Plateformes trouvées:", profile.destinyMemberships.length);

        // Trouve automatiquement Epic Games (membershipType: 6)
        const epicPlatform = profile.destinyMemberships.find(
          (membership) => membership.membershipType === 6
        );

        if (epicPlatform) {
          console.log("🎯 Epic Games trouvé, chargement automatique...");

          const formattedPlatform = {
            membershipType: epicPlatform.membershipType,
            membershipId: epicPlatform.membershipId,
            displayName: epicPlatform.displayName,
            platformName: "Epic Games",
            iconPath: epicPlatform.iconPath,
            isPublic: epicPlatform.isPublic,
            crossSaveOverride: epicPlatform.crossSaveOverride,
            isPrimary: true,
          };

          setSelectedPlatform(formattedPlatform);
          setPlatforms([formattedPlatform]); // Une seule plateforme

          // Charge automatiquement les personnages Epic
          await handlePlatformSelect(formattedPlatform);
        } else {
          console.log("❌ Pas de compte Epic Games trouvé");
          setPlatforms([]);
        }
      } else {
        console.log("❌ Aucune plateforme Destiny trouvée");
        setPlatforms([]);
      }

      return profile;
    } catch (error) {
      console.error("❌ Erreur loadUserData:", error);
      throw error;
    }
  };

  // Fonction helper pour les noms de plateformes
  const getPlatformName = (membershipType) => {
    const platforms = {
      1: "Xbox",
      2: "PlayStation",
      3: "Steam",
      4: "Blizzard",
      5: "Stadia",
      6: "Epic Games",
      254: "Bungie.net",
    };
    return platforms[membershipType] || "Inconnu";
  };

  // Sélectionner une plateforme
  const handlePlatformSelect = async (platform) => {
    console.log("🎯 Plateforme sélectionnée:", platform);
    setSelectedPlatform(platform);
    setCharacters([]);
    setLoading(true);

    try {
      const profileData = await getDestinyProfileFromPlatform(
        platform.membershipType,
        platform.membershipId
      );

      console.log("🔍 Données profil reçues:", profileData);

      if (profileData.characters?.data) {
        const charactersArray = await Promise.all(
          Object.entries(profileData.characters.data).map(
            async ([characterId, character]) => {
              console.log("🔍 Character brut:", character);

              // Génère l'URL de l'image directement
              const characterImageUrl = `https://www.bungie.net/Platform/Destiny2/Companion/Pgcr/CustomDyes/?characterId=${characterId}&membershipType=${platform.membershipType}&membershipId=${platform.membershipId}`;

              console.log("🖼️ URL image générée:", characterImageUrl);

              return {
                id: characterId,
                characterId: characterId,
                className: getClassNameFromHash(character.classHash),
                raceTypeName: getRaceNameFromHash(character.raceHash),
                genderTypeName: getGenderNameFromHash(character.genderHash),
                level:
                  character.levelProgression?.level ||
                  character.baseCharacterLevel ||
                  0,
                light: character.light || 0,

                // Images du personnage - utilise l'URL directe
                emblemPath: character.emblemPath,
                emblemBackgroundPath: character.emblemBackgroundPath,
                characterPortrait: characterImageUrl, // ← URL directe
                hasFullImage: true,

                // Données de temps
                minutesPlayedTotal: parseInt(character.minutesPlayedTotal) || 0,
                lastPlayed: new Date(character.dateLastPlayed),
                titleRecordHash: character.titleRecordHash,
                stats: character.stats || {},
              };
            }
          )
        );

        console.log("🎮 Personnages formatés avec vraies images:", charactersArray);
        setCharacters(charactersArray);
      }
    } catch (error) {
      console.error("❌ Erreur sélection plateforme:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner un personnage
  const handleCharacterSelect = async (character) => {
    try {
      setSelectedCharacter(character);
      setCharacterDetails(null);

      // Vérifie que le personnage existe bien dans la liste
      if (!character || !character.id) {
        setError("Personnage inexistant ou non sélectionné.");
        return;
      }

      const details = await getCharacterDetails(
        selectedPlatform.membershipType,
        selectedPlatform.membershipId,
        character.id
      );

      setCharacterDetails(details);
    } catch (err) {
      // Ignore proprement les erreurs 500 HTML Bungie
      setError(
        `Erreur personnage ${character.className} : ${
          err.message.includes("non JSON")
            ? "Personnage inexistant ou supprimé."
            : err.message
        }`
      );
    }
  };

  // Connexion
  const login = (authUrl) => {
    setError(null);
    window.location.href = authUrl;
  };

  // Traiter callback avec le code
  const handleCallback = async (code, state) => {
    try {
      setLoading(true);
      setError(null);

      const authData = await handleAuthCallback(code, state);
      await loadUserData();

      return authData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = () => {
    clearAuthData();
    setUser(null);
    setPlatforms([]);
    setSelectedPlatform(null);
    setCharacters([]);
    setSelectedCharacter(null);
    setCharacterDetails(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // Rafraîchir
  const refresh = async () => {
    if (!isTokenValid()) {
      logout();
      return;
    }

    try {
      await loadUserData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Fonctions helper pour convertir les hash en noms
  const getClassNameFromHash = (classHash) => {
    const classes = {
      671679327: "Chasseur", // Hunter
      2271682572: "Arcaniste", // Warlock
      3655393761: "Titan", // Titan
    };
    return classes[classHash] || "Inconnu";
  };

  const getRaceNameFromHash = (raceHash) => {
    const races = {
      3887404748: "Humain", // Human
      898834093: "Exo", // Exo
      2803282938: "Éveillé", // Awoken
    };
    return races[raceHash] || "Inconnu";
  };

  const getGenderNameFromHash = (genderHash) => {
    const genders = {
      3111576190: "Masculin", // Male
      2204441813: "Féminin", // Female
    };
    return genders[genderHash] || "Inconnu";
  };

  return {
    user,
    platforms,
    selectedPlatform,
    characters,
    selectedCharacter,
    characterDetails,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    handleCallback,
    handlePlatformSelect,
    handleCharacterSelect,
    refresh,
  };
};
