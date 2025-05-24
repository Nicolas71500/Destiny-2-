require("dotenv").config();
const BUNGIE_API_KEY = process.env.BUNGIE_API_KEY;

const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔧 Configuration des routes...");

app.post("/api/token", async (req, res) => {
  console.log("📝 Route /api/token appelée");
  const { code, clientId } = req.body;
  if (!code || !clientId) {
    return res.status(400).json({ error: "Missing code or clientId" });
  }
  try {
    const tokenResponse = await fetch(
      "https://www.bungie.net/platform/app/oauth/token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          client_id: clientId,
        }),
      }
    );
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(400).json(tokenData);
    }
    res.json(tokenData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/user", async (req, res) => {
  console.log("👤 Route /api/user appelée avec :", req.body);
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "Missing accessToken" });
  }

  try {
    const response = await fetch(
      "https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-API-Key": BUNGIE_API_KEY,
        },
      }
    );

    // Vérifier le Content-Type de la réponse
    const contentType = response.headers.get("content-type");
    console.log("📄 Content-Type de Bungie :", contentType);
    console.log("📊 Status de Bungie :", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.log("❌ Réponse d'erreur Bungie :", text.substring(0, 200));
      return res.status(response.status).json({
        error: "Erreur API Bungie",
        status: response.status,
        details: text.substring(0, 200),
      });
    }

    // Vérifier si la réponse est du JSON
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log("❌ Réponse non-JSON de Bungie :", text.substring(0, 200));
      return res.status(400).json({
        error: "Réponse non-JSON de Bungie",
        contentType: contentType,
        preview: text.substring(0, 200),
      });
    }

    const data = await response.json();
    console.log("✅ Réponse JSON de Bungie :", data);

    if (data.ErrorCode !== 1) {
      return res.status(400).json({ error: data.Message, details: data });
    }

    res.json(data.Response);
  } catch (error) {
    console.log("❌ Erreur serveur :", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/destiny-profile", async (req, res) => {
  console.log("🎮 Route /api/destiny-profile appelée avec :", req.body);
  const { accessToken, membershipType, membershipId } = req.body;

  if (!accessToken || !membershipType || !membershipId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Ajoute plus de composants pour récupérer les images de personnages
    const response = await fetch(
      `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=100,200,205,800`,
      //                                                                                                    ^^^ Ajoute 800 pour CharacterRenderData
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-API-Key": BUNGIE_API_KEY,
        },
      }
    );

    const contentType = response.headers.get("content-type");
    console.log("📄 Content-Type Bungie:", contentType);
    console.log("📊 Status Bungie:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.log("❌ Erreur Bungie:", text.substring(0, 200));
      return res.status(response.status).json({
        error: "Erreur API Bungie",
        status: response.status,
        details: text.substring(0, 200),
      });
    }

    const data = await response.json();
    console.log("✅ Profil Destiny récupéré avec composants avancés");

    if (data.ErrorCode !== 1) {
      return res.status(400).json({ error: data.Message, details: data });
    }

    res.json(data.Response);
  } catch (error) {
    console.log("❌ Erreur serveur:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Ajoute ce nouvel endpoint
app.post("/api/character-image", async (req, res) => {
  console.log("🖼️ Route /api/character-image appelée avec :", req.body);
  const { accessToken, membershipType, membershipId, characterId } = req.body;

  if (!accessToken || !membershipType || !membershipId || !characterId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // URL pour récupérer l'image complète du personnage
    const imageUrl = `https://www.bungie.net/Platform/Destiny2/Companion/Pgcr/CustomDyes/?characterId=${characterId}&membershipType=${membershipType}&membershipId=${membershipId}`;

    const response = await fetch(imageUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-API-Key": BUNGIE_API_KEY,
      },
    });

    if (!response.ok) {
      console.log("❌ Impossible de récupérer l'image personnage");
      return res.status(404).json({ error: "Image non disponible" });
    }

    // Retourne directement l'URL de l'image
    res.json({ imageUrl: imageUrl });
  } catch (error) {
    console.log("❌ Erreur serveur:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Remplace l'endpoint existant par :
app.post("/api/character-equipment", async (req, res) => {
  console.log("🎮 Route /api/character-equipment appelée");
  const { accessToken, membershipType, membershipId, characterId } = req.body;

  if (!accessToken || !membershipType || !membershipId || !characterId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Récupère l'inventaire ET l'équipement équipé
    const response = await fetch(
      `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/?components=201,205,300,302,304,305,102`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-API-Key": BUNGIE_API_KEY,
        },
      }
    );

    console.log("📊 Status équipement:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Erreur Bungie équipement:", errorText.substring(0, 200));
      return res.status(response.status).json({ error: "Erreur API Bungie" });
    }

    const data = await response.json();
    console.log(
      "✅ Équipements récupérés, composants:",
      Object.keys(data.Response || {})
    );

    // Log détaillé de la structure
    if (data.Response?.inventory?.data?.items) {
      console.log(
        "📦 Nombre d'items dans inventory:",
        data.Response.inventory.data.items.length
      );
    }
    if (data.Response?.equipment?.data?.items) {
      console.log(
        "⚔️ Nombre d'items équipés:",
        data.Response.equipment.data.items.length
      );
    }

    if (data.ErrorCode !== 1) {
      return res.status(400).json({ error: data.Message, details: data });
    }

    res.json(data.Response);
  } catch (error) {
    console.log("❌ Erreur serveur:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Assure-toi que cet endpoint est bien présent AVANT le app.listen() :

app.post("/api/item-details", async (req, res) => {
  console.log("📦 Route /api/item-details appelée");
  const { itemHashes } = req.body;

  if (!itemHashes || !Array.isArray(itemHashes)) {
    return res.status(400).json({ error: "Missing itemHashes array" });
  }

  console.log("⚡ Récupération ULTRA-RAPIDE pour", itemHashes.length, "items");

  try {
    const startTime = Date.now();

    // 🚀 TRAITEMENT MASSIF EN PARALLÈLE
    const batchSize = 25; // 25 requêtes simultanées !
    const itemDetails = {};

    // Fonction pour traiter un item
    const fetchItemDetails = async (hash) => {
      try {
        const response = await fetch(
          `https://www.bungie.net/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${hash}/`,
          {
            method: "GET",
            headers: {
              "X-API-Key": BUNGIE_API_KEY,
            },
            timeout: 5000, // Timeout de 5 secondes
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.Response) {
            return {
              hash,
              success: true,
              data: {
                name: data.Response.displayProperties?.name || `Item ${hash}`,
                description: data.Response.displayProperties?.description || "",
                icon: data.Response.displayProperties?.icon || "",
                itemTypeDisplayName: data.Response.itemTypeDisplayName || "",
                tierTypeName: data.Response.inventory?.tierTypeName || "",
                tierType: data.Response.inventory?.tierType || 0,
              },
            };
          }
        }
        return { hash, success: false };
      } catch (error) {
        return { hash, success: false, error: error.message };
      }
    };

    // 🎯 TRAITE TOUT EN PARALLÈLE PAR BATCHES
    for (let i = 0; i < itemHashes.length; i += batchSize) {
      const batch = itemHashes.slice(i, i + batchSize);

      console.log(
        `⚡ Batch ${Math.floor(i / batchSize) + 1}: ${
          batch.length
        } items en parallèle`
      );

      // Lance toutes les requêtes du batch en même temps
      const batchPromises = batch.map(fetchItemDetails);
      const batchResults = await Promise.all(batchPromises);

      // Stocke les résultats
      batchResults.forEach((result) => {
        if (result.success) {
          itemDetails[result.hash] = result.data;
        }
      });

      const successCount = batchResults.filter((r) => r.success).length;
      console.log(
        `✅ +${successCount} items (Total: ${Object.keys(itemDetails).length})`
      );

      // Pause très courte
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(
      `🚀 FINI en ${duration}s ! ${Object.keys(itemDetails).length}/${
        itemHashes.length
      } items`
    );
    res.json(itemDetails);
  } catch (error) {
    console.log("❌ Erreur serveur:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route de test
app.get("/test", (req, res) => {
  console.log("🧪 Route /test appelée");
  res.json({
    message: "Serveur OK",
    routes: ["POST /api/token", "POST /api/user"],
  });
});

console.log("✅ Routes configurées");

const httpsOptions = {
  key: fs.readFileSync("./ssl/127.0.0.1-key.pem"),
  cert: fs.readFileSync("./ssl/127.0.0.1.pem"),
};

https.createServer(httpsOptions, app).listen(3001, "127.0.0.1", () => {
  console.log("🚀 API HTTPS sur https://127.0.0.1:3001");
  console.log("📋 Routes disponibles :");
  console.log("   POST /api/token");
  console.log("   POST /api/user");
  console.log("   GET  /test");
});

// Ajoute cet endpoint dans api-server.js :
app.post("/api/character-stats", async (req, res) => {
  console.log("📊 Route /api/character-stats appelée");
  const { accessToken, membershipType, membershipId, characterId } = req.body;

  if (!accessToken || !membershipType || !membershipId || !characterId) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const startTime = Date.now();

    // Récupère les stats détaillées avec composants 200 (CharacterActivities) et 302 (ItemInstances)
    const response = await fetch(
      `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/?components=200,201,205,300,302,304,305`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-API-Key": BUNGIE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Erreur stats:", errorText.substring(0, 200));
      return res.status(response.status).json({ error: "Erreur API Bungie" });
    }

    const data = await response.json();

    if (data.ErrorCode !== 1) {
      return res.status(400).json({ error: data.Message });
    }

    // Traite les stats du personnage
    const characterStats = data.Response.character?.data?.stats || {};
    const equipment = data.Response.equipment?.data?.items || [];
    const itemInstances = data.Response.itemComponents?.instances?.data || {};

    console.log(
      "📊 Stats du personnage récupérées:",
      Object.keys(characterStats)
    );
    console.log(
      "⚔️ Équipements avec instances:",
      Object.keys(itemInstances).length
    );

    const endTime = Date.now();
    console.log(`✅ Stats récupérées en ${(endTime - startTime) / 1000}s`);

    res.json({
      characterStats,
      equipment,
      itemInstances,
      totalItems: equipment.length,
    });
  } catch (error) {
    console.log("❌ Erreur serveur stats:", error.message);
    res.status(500).json({ error: error.message });
  }
});
