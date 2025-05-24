import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleAuthCallback } from "../services/bungie-auth"; // 🎯 Bonne fonction

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processedRef = useRef(false); // ← Ajoute cette référence

  useEffect(() => {
    const processCallback = async () => {
      // ← Évite le double traitement
      if (processedRef.current) {
        console.log("🔄 Callback déjà traité, ignore...");
        return;
      }
      processedRef.current = true;

      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        console.error("❌ Erreur OAuth:", error);
        navigate("/login?error=" + encodeURIComponent(error));
        return;
      }

      if (!code || !state) {
        console.error("❌ Paramètres OAuth manquants");
        navigate("/login?error=missing_params");
        return;
      }

      try {
        console.log("🔄 Traitement du callback OAuth...");
        await handleAuthCallback(code, state);
        console.log("✅ Authentification réussie");
        navigate("/");
      } catch (error) {
        console.error("❌ Erreur callback:", error);
        navigate("/login?error=" + encodeURIComponent(error.message));
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="auth-callback">
      <h2>Connexion en cours...</h2>
      <p>Traitement de l'authentification Bungie...</p>
    </div>
  );
};

export default AuthCallback;
