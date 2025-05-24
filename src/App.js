import React, { useState } from "react";
import "./styles/App.css";
import "./styles/character.css"; // 🎯 Nouveau CSS
import WeaponList from "./components/WeaponList";
import ArmorList from "./components/ArmorList";
import CharacterManager from "./components/CharacterManager"; // 🎯 Nouveau composant
import { useManifest } from "./hooks/useDestinyItem";
import ItemDetail from "./components/ItemDetail";
import BungieLogin from "./components/BungieLogin";
import AuthCallback from "./components/AuthCallback";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CharacterDetail from "./components/CharacterDetail"; // Ajoute cette ligne

function App() {
  const [activeTab, setActiveTab] = useState("weapons");
  const { manifestLoaded, loading } = useManifest();

  if (loading || !manifestLoaded) {
    return (
      <div className="App">
        <div className="loading-screen">
          <h2>Chargement du manifest Destiny 2...</h2>
          <p>Veuillez patienter, cela peut prendre quelques secondes.</p>
          {loading && <div className="spinner">⏳</div>}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="header-main">
            <h1>Destiny 2 Exotic Tracker</h1>
            <BungieLogin />
          </div>

          <nav>
            <button
              className={activeTab === "weapons" ? "nav-btn active" : "nav-btn"}
              onClick={() => setActiveTab("weapons")}
            >
              Armes Exotiques
            </button>
            <button
              className={activeTab === "armors" ? "nav-btn active" : "nav-btn"}
              onClick={() => setActiveTab("armors")}
            >
              Armures Exotiques
            </button>
            <button
              className={
                activeTab === "characters" ? "nav-btn active" : "nav-btn"
              }
              onClick={() => setActiveTab("characters")}
            >
              🎮 Mes Gardiens
            </button>
          </nav>
        </header>

        <main>
          <Routes>
            <Route
              path="/"
              element={
                <div className="app-content">
                  {activeTab === "characters" && <CharacterManager />}
                  {activeTab === "weapons" && (
                    <div className="equipment-section">
                      <div className="equipment-tabs">
                        <button
                          className={`equipment-tab ${
                            activeTab === "weapons" ? "active" : ""
                          }`}
                          onClick={() => setActiveTab("weapons")}
                        >
                          ⚔️ Armes
                        </button>
                        <button
                          className={`equipment-tab ${
                            activeTab === "armors" ? "active" : ""
                          }`}
                          onClick={() => setActiveTab("armors")}
                        >
                          🛡️ Armures
                        </button>
                      </div>
                      {activeTab === "weapons" ? <WeaponList /> : <ArmorList />}
                    </div>
                  )}
                </div>
              }
            />
            <Route path="/character/:characterId" element={<CharacterDetail />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/item/:type/:hash" element={<ItemDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
