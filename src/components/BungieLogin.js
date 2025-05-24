import React from "react";
import { getBungieAuthUrl } from "../services/bungie-auth";
import { useBungieAuth } from "../hooks/useBungieAuth";

const BungieLogin = () => {
  const { isLoggedIn, logout } = useBungieAuth();

  const handleLogin = () => {
    const authUrl = getBungieAuthUrl();
    console.log("🚀 Redirection vers:", authUrl); // Debug
    window.location.href = authUrl;
  };

  if (isLoggedIn) {
    return (
      <div className="bungie-user-profile">
        <span>✅ Connecté</span>
        <button onClick={logout} className="logout-btn">
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="bungie-login">
      <button onClick={handleLogin} className="bungie-login-btn">
        🌐 Se connecter avec Bungie
      </button>
    </div>
  );
};

export default BungieLogin;
