import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import weapons from "../data/weapons";
import armors from "../data/armors";
import { useDestinyItem } from "../hooks/useDestinyItem";

const ItemDetail = () => {
  const { type, hash } = useParams();
  const navigate = useNavigate();
  const [imageStage, setImageStage] = useState("api");

  // Trouver l'item selon le type
  const item =
    type === "weapon"
      ? weapons.find((w) => w.hash.toString() === hash)
      : armors.find((a) => a.hash.toString() === hash);

  // Utiliser le même hook que WeaponCard - CORRECTION ICI
  const { item: apiItem, loading, error } = useDestinyItem(item?.hash);

  // Reset imageStage quand on change d'item
  useEffect(() => {
    setImageStage("api");
  }, [hash]);

  if (!item) {
    return (
      <div className="item-detail-container">
        <div className="item-not-found">
          <h2>Item non trouvé</h2>
          <button onClick={() => navigate(-1)} className="back-btn">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const getDamageTypeColor = (damageType) => {
    const colors = {
      Kinétique: "#8b9dc3",
      Arc: "#79bee8",
      Solaire: "#f2721b",
      Abyssale: "#5f7a61",
      Stase: "#4d9be6",
      Prismatique: "linear-gradient(45deg, #f2721b, #79bee8, #5f7a61, #4d9be6)",
      Neutre: "#888",
    };
    return colors[damageType] || "#666";
  };

  const getClassColor = (className) => {
    const colors = {
      Titan: "#e74c3c",
      Chasseur: "#f39c12",
      Arcaniste: "#9b59b6",
    };
    return colors[className] || "#3498db";
  };

  // Image de fallback en CSS pur
  const FallbackImage = () => (
    <div className="fallback-image">
      <div className="fallback-content">
        <div className="fallback-title">DESTINY 2</div>
        <div className="fallback-subtitle">EXOTIC</div>
        <div className="fallback-icon">⚡</div>
      </div>
    </div>
  );

  // Composant pour l'image de l'item - SIMPLIFIÉ comme WeaponCard
  const ItemImage = () => {
    if (loading) {
      return (
        <div className="fallback-image">
          <div className="fallback-content">
            <div className="fallback-title">Chargement...</div>
            <div className="fallback-icon">⏳</div>
          </div>
        </div>
      );
    }

    if (apiItem?.icon) {
      return (
        <img
          src={apiItem.icon}
          alt={item.name}
          className="item-image"
          onError={() => {
            setImageStage("fallback");
          }}
        />
      );
    }

    return <FallbackImage />;
  };

  return (
    <div className="item-detail-container">
      <button onClick={() => navigate(-1)} className="back-btn">
        ← Retour
      </button>

      <div className="item-detail-card">
        <div className="item-header">
          <div className="item-image-container">
            {imageStage === "fallback" ? <FallbackImage /> : <ItemImage />}
            <div className="item-image-overlay">
              {type === "weapon" && (
                <span
                  className="damage-badge"
                  style={{
                    background: getDamageTypeColor(item.damage),
                    color:
                      item.damage === "Kinétique" || item.damage === "Arc"
                        ? "#000"
                        : "#fff",
                  }}
                >
                  {item.damage}
                </span>
              )}
              {type === "armor" && (
                <span
                  className="class-badge"
                  style={{ background: getClassColor(item.class) }}
                >
                  {item.class}
                </span>
              )}
            </div>
          </div>

          <div className="item-title-section">
            <h1 className="item-name">{apiItem?.name || item.name}</h1>
            <div className="item-meta">
              <span className="item-type">
                {apiItem?.itemTypeDisplayName || item.type}
              </span>
              {type === "weapon" && (
                <span
                  className="damage-type"
                  style={{
                    background: getDamageTypeColor(item.damage),
                    color:
                      item.damage === "Kinétique" || item.damage === "Arc"
                        ? "#000"
                        : "#fff",
                  }}
                >
                  {item.damage}
                </span>
              )}
              {type === "armor" && (
                <span
                  className="class-type"
                  style={{ background: getClassColor(item.class) }}
                >
                  {item.class}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="item-content">
          <div className="item-info">
            <div className="info-section">
              <h3>Informations générales</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Hash:</span>
                  <span className="value">{item.hash}</span>
                </div>
                <div className="info-item">
                  <span className="label">Type:</span>
                  <span className="value">
                    {apiItem?.itemTypeDisplayName || item.type}
                  </span>
                </div>
                {apiItem?.flavorText && (
                  <div className="info-item">
                    <span className="label">Description:</span>
                    <span className="value">{apiItem.flavorText}</span>
                  </div>
                )}
                {type === "weapon" && (
                  <div className="info-item">
                    <span className="label">Type de dégât:</span>
                    <span className="value">{item.damage}</span>
                  </div>
                )}
                {type === "armor" && (
                  <div className="info-item">
                    <span className="label">Classe:</span>
                    <span className="value">{item.class}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="stats-section">
              <h3>Statistiques</h3>
              <div className="stats-grid">
                {Object.entries(item.stats).map(([stat, value]) => (
                  <div key={stat} className="stat-item">
                    <div className="stat-header">
                      <span className="stat-name">
                        {stat.charAt(0).toUpperCase() + stat.slice(1)}
                      </span>
                      <span className="stat-value">{value}</span>
                    </div>
                    <div className="stat-bar">
                      <div
                        className="stat-fill"
                        style={{
                          width: `${Math.min((value / 100) * 100, 100)}%`,
                          background:
                            value > 70
                              ? "#27ae60"
                              : value > 40
                              ? "#f39c12"
                              : "#e74c3c",
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
