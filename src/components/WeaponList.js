import React, { useState, useEffect } from "react";
import WeaponCard from "./WeaponCard";
import weapons from "../data/weapons";

const WeaponList = () => {
  const [filters, setFilters] = useState({
    damageType: "",
  });

  const damageTypes = [
    "Tous",
    "Kinétique",
    "Arc",
    "Solaire",
    "Abyssale",
    "Stase",
    "Prismatique",
    "Neutre",
  ];

  // Forcer un re-render quand les filtres changent
  const [, forceUpdate] = useState({});

  const filteredWeapons = weapons.filter((weapon) => {
    // Si aucun filtre n'est sélectionné ou si "Tous" est sélectionné
    if (!filters.damageType || filters.damageType === "") {
      return true;
    }
    // Sinon, filtrer par type de dégât
    return weapon.damage === filters.damageType;
  });

  const handleDamageTypeChange = (damageType) => {
    console.log("Filtre sélectionné:", damageType);
    const newDamageType = damageType === "Tous" ? "" : damageType;

    setFilters({
      ...filters,
      damageType: newDamageType,
    });

    // Forcer un re-render
    forceUpdate({});
  };

  // Debug - afficher les types de dégâts uniques dans la console
  useEffect(() => {
    const uniqueDamageTypes = [
      ...new Set(weapons.map((weapon) => weapon.damage)),
    ];
    console.log("Types de dégâts disponibles:", uniqueDamageTypes);
  }, []);

  console.log("Filtre actuel:", filters.damageType);
  console.log("Armes filtrées:", filteredWeapons.length);
  console.log(
    "Première arme filtrée:",
    filteredWeapons[0]?.name,
    filteredWeapons[0]?.damage
  );

  return (
    <div className="armor-list">
      <h2>Armes Exotiques ({filteredWeapons.length})</h2>

      <div className="class-filter">
        {damageTypes.map((type) => (
          <button
            key={type}
            className={`filter-btn ${
              (type === "Tous" && !filters.damageType) ||
              filters.damageType === type
                ? "active"
                : ""
            } damage-${type.toLowerCase()}`}
            onClick={() => handleDamageTypeChange(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="cards-container">
        {filteredWeapons.map((weapon, index) => (
          <WeaponCard
            key={`${weapon.hash}-${filters.damageType}-${index}`}
            weapon={weapon}
          />
        ))}
      </div>
    </div>
  );
};

export default WeaponList;
