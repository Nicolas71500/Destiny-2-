import { testMultipleHashes } from "../services/bungie-api";

export const knownWorkingHashes = [
  { name: "Skull of Dire Ahamkara", hash: 2523259394 },
  { name: "Crown of Tempests", hash: 2523259395 },
  { name: "Ace of Spades", hash: 347366834 },
  { name: "Gjallarhorn", hash: 1363886209 },
  { name: "Whisper of the Worm", hash: 1891561814 },
];

export const testKnownHashes = async () => {
  console.log("🧪 Test des hash connus...");
  const results = await testMultipleHashes(knownWorkingHashes);
  console.table(results);
  return results;
};
