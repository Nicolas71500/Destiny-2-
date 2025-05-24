import React, { useState } from "react";
import "./styles/App.css";
import "./styles/character.css";
import CharacterManager from "./components/CharacterManager";
import { useManifest } from "./hooks/useDestinyItem";
import ItemDetail from "./components/ItemDetail";
import BungieLogin from "./components/BungieLogin";
import AuthCallback from "./components/AuthCallback";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CharacterDetail from "./components/CharacterDetail";

function App() {
  const [activeTab, setActiveTab] = useState("characters"); // Change par défaut
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
            <h1>Destiny 2 Character Manager</h1>
            <BungieLogin />
          </div>

          <nav>
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
                </div>
              }
            />
            <Route
              path="/character/:characterId"
              element={<CharacterDetail />}
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/item/:type/:hash" element={<ItemDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
