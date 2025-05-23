import React from "react";
import { useDestinyItem } from "../hooks/useDestinyItem";
import { useNavigate } from "react-router-dom";

function WeaponCard({ weapon }) {
  const { item, loading, error } = useDestinyItem(weapon.hash);
  const navigate = useNavigate();

  console.log("WeaponCard - weapon:", weapon);
  console.log("WeaponCard - item:", item);
  console.log("WeaponCard - loading:", loading);
  console.log("WeaponCard - error:", error);

  const handleClick = () => {
    navigate(`/item/weapon/${weapon.hash}`);
  };

  if (!weapon || !weapon.stats) {
    return <div>Erreur: données d'arme manquantes</div>;
  }

  if (loading) {
    return (
      <div className="card weapon-card">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card weapon-card">
        <div className="error">Erreur: {error}</div>
      </div>
    );
  }

  // Image de fallback qui fonctionne
  const fallbackImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23333'/%3E%3Ctext x='48' y='52' text-anchor='middle' fill='white' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";

  return (
    <div
      className="card weapon-card"
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <div className="card-image">
        <img
          src={item?.icon || fallbackImage}
          alt={weapon.name}
          onError={(e) => {
            console.error("Erreur de chargement d'image:", e);
            e.target.src = fallbackImage;
          }}
          onLoad={() => {
            console.log("Image chargée avec succès pour:", weapon.name);
          }}
        />
      </div>
      <h3>{weapon.name}</h3>
      <p>
        <strong>Type:</strong> {weapon.type}
      </p>
      <p>
        <strong>Dégâts:</strong> {weapon.damage}
      </p>
      <div className="stats">
        <h4>Statistiques:</h4>
        <ul>
          <li>Impact: {weapon.stats.impact}</li>
          <li>Portée: {weapon.stats.range}</li>
          <li>Stabilité: {weapon.stats.stability}</li>
          <li>Maniabilité: {weapon.stats.handling}</li>
          <li>Rechargement: {weapon.stats.reload}</li>
          <li>Cadence: {weapon.stats.rpm} CPM</li>
        </ul>
      </div>
    </div>
  );
}

export default WeaponCard;
