import React from "react";
import { useDestinyItem } from "../hooks/useDestinyItem";
import { useNavigate } from "react-router-dom";

function ArmorCard({ armor }) {
  const navigate = useNavigate();
  const { item, loading, error } = useDestinyItem(armor.hash);

  const handleClick = () => {
    navigate(`/item/armor/${armor.hash}`);
  };

  if (!armor || !armor.stats) {
    return <div>Erreur: données d'armure manquantes</div>;
  }

  if (loading) {
    return (
      <div className="card armor-card">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  // Image de fallback qui fonctionne
  const fallbackImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23333'/%3E%3Ctext x='48' y='52' text-anchor='middle' fill='white' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";

  return (
    <div
      className="card armor-card"
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <div className="card-image">
        <img
          src={item?.icon || fallbackImage}
          alt={armor.name}
          onError={(e) => {
            e.target.src = fallbackImage;
          }}
        />
      </div>
      <h3>{armor.name}</h3>
      <p>
        <strong>Type:</strong> {armor.type}
      </p>
      <p>
        <strong>Classe:</strong> {armor.class}
      </p>
      <div className="stats">
        <h4>Statistiques:</h4>
        <ul>
          <li>Résilience: {armor.stats.resilience}</li>
          <li>Récupération: {armor.stats.recovery}</li>
          <li>Mobilité: {armor.stats.mobility}</li>
        </ul>
      </div>
    </div>
  );
}

export default ArmorCard;
