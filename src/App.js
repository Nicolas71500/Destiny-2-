import React, { useState, useEffect } from "react";
import "./styles/App.css";
import WeaponList from "./components/WeaponList";
import ArmorList from "./components/ArmorList";
import { useManifest } from "./hooks/useDestinyItem";
import { testKnownHashes } from "./utils/testHashes";
import ItemDetail from "./components/ItemDetail";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const [activeTab, setActiveTab] = useState("weapons");
  const { manifestLoaded, loading } = useManifest();

  useEffect(() => {
    const runTest = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Attendre 2 secondes
        const results = await testKnownHashes();
        console.log("🎯 Résultats des tests:", results);
      } catch (error) {
        console.error("💥 Erreur lors du test:", error);
      }
    };

    runTest();
  }, []);

  if (loading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <h2>Chargement du manifest Destiny 2...</h2>
          <p>Veuillez patienter, cela peut prendre quelques secondes.</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Destiny 2 Exotic Tracker</h1>
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
          </nav>
          {!manifestLoaded && (
            <div className="warning">
              ⚠️ Manifest non chargé - Images par défaut utilisées
            </div>
          )}
        </header>

        <main>
          <Routes>
            <Route
              path="/"
              element={activeTab === "weapons" ? <WeaponList /> : <ArmorList />}
            />
            <Route path="/item/:type/:hash" element={<ItemDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
