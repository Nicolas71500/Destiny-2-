import React from "react";

const PlatformSelector = ({
  platforms,
  selectedPlatform,
  onPlatformSelect,
  loading,
}) => {
  if (loading) {
    return (
      <div className="platform-selector-loading">
        Chargement des plateformes...
      </div>
    );
  }

  if (platforms.length === 0) {
    return <div className="no-platforms">Aucun profil Destiny 2 trouvé</div>;
  }

  if (platforms.length === 1) {
    return (
      <div className="single-platform">
        <span
          className={`platform-badge ${platforms[0].platformName.toLowerCase()}`}
        >
          🎮 {platforms[0].platformName}
          {platforms[0].isCrossSavePrimary && " (Principal)"}
        </span>
      </div>
    );
  }

  const getPlatformIcon = (platformName) => {
    const icons = {
      Xbox: "🎮",
      PlayStation: "🎮",
      Steam: "💻",
      "Epic Games": "🎮",
      "Bungie.net": "🌐",
    };
    return icons[platformName] || "🎮";
  };

  return (
    <div className="platform-selector">
      <label className="platform-label">Plateforme :</label>
      <select
        value={selectedPlatform?.membershipId || ""}
        onChange={(e) => {
          const platform = platforms.find(
            (p) => p.membershipId === e.target.value
          );
          onPlatformSelect(platform);
        }}
        className="platform-dropdown"
      >
        {platforms.map((platform) => (
          <option key={platform.membershipId} value={platform.membershipId}>
            {getPlatformIcon(platform.platformName)} {platform.platformName} -{" "}
            {platform.displayName}
            {platform.isCrossSavePrimary && " (Principal)"}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PlatformSelector;
