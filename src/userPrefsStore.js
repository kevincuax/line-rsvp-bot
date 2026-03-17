const fs = require("fs");
const path = require("path");

const PREFS_PATH = path.join(__dirname, "..", "userPrefs.json");

function loadPrefs() {
  if (!fs.existsSync(PREFS_PATH)) return {};
  const raw = fs.readFileSync(PREFS_PATH, "utf8");
  return raw.trim() ? JSON.parse(raw) : {};
}

function savePrefs(prefs) {
  fs.writeFileSync(PREFS_PATH, JSON.stringify(prefs, null, 2), "utf8");
}

function getUserLang(userId) {
  const prefs = loadPrefs();
  return prefs[userId]?.lang || null; // "en" | "jp" | null
}

function setUserLang(userId, lang) {
  const prefs = loadPrefs();
  prefs[userId] = { ...(prefs[userId] || {}), lang };
  savePrefs(prefs);
}

module.exports = { getUserLang, setUserLang };