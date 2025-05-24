export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, clientId } = req.body;

  if (!code || !clientId) {
    return res.status(400).json({ error: "Missing code or clientId" });
  }

  try {
    console.log("🔄 Échange de code pour token...", {
      code: code.substring(0, 10) + "...",
      clientId,
    });

    // 🔧 Utiliser fetch global (Node 18+)
    const tokenResponse = await globalThis.fetch(
      "https://www.bungie.net/platform/app/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          client_id: clientId,
        }),
      }
    );

    console.log("📡 Réponse Bungie status:", tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("❌ Erreur Bungie token:", tokenResponse.status, errorText);
      return res.status(400).json({
        error: "Failed to exchange code for token",
        status: tokenResponse.status,
        details: errorText,
      });
    }

    const tokenData = await tokenResponse.json();
    console.log("✅ Token échangé avec succès");

    return res.status(200).json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      membership_id: tokenData.membership_id,
    });
  } catch (error) {
    console.error("❌ Erreur complète:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}

export const refreshTokenIfNeeded = async () => {
  if (!isTokenValid()) {
    console.log("🔄 Token expiré, redirection vers login...");
    clearAuthData();
    window.location.href = getBungieAuthUrl();
    return false;
  }
  return true;
};
