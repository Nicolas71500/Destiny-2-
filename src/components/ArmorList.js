import React, { useState } from 'react';
import ArmorCard from './ArmorCard';
import armors from '../data/armors';

function ArmorList() {
  const [selectedClass, setSelectedClass] = useState('Toutes');
  
  // Filtrer les armures par classe
  const filteredArmors = selectedClass === 'Toutes' 
    ? armors 
    : armors.filter(armor => armor.class === selectedClass);

  return (
    <div className="armor-list">
      <h2>Armures Exotiques</h2>
      
      {/* Boutons de filtrage par classe */}
      <div className="class-filter">
        <button 
          className={selectedClass === 'Toutes' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setSelectedClass('Toutes')}
        >
          Toutes les Classes
        </button>
        <button 
          className={selectedClass === 'Titan' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setSelectedClass('Titan')}
        >
          Titan
        </button>
        <button 
          className={selectedClass === 'Chasseur' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setSelectedClass('Chasseur')}
        >
          Chasseur
        </button>
        <button 
          className={selectedClass === 'Arcaniste' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setSelectedClass('Arcaniste')}
        >
          Arcaniste
        </button>
      </div>

      <div className="cards-container">
        {filteredArmors.map((armor, index) => (
          <ArmorCard key={armor.name || index} armor={armor} />
        ))}
      </div>
    </div>
  );
}

export default ArmorList;