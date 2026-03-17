// src/adminStore.js
const fs = require("fs");
const path = require("path");

const ADMINS_PATH = path.join(__dirname, "admins.json");

function loadAdmins() {
  try {
    const raw = fs.readFileSync("/Users/kevincua/Desktop/LINE_test/admins.json", "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.admins) ? parsed.admins : [];
  } catch (e) {
    // If file missing or invalid JSON, treat as no admins
    return [];
  }
}

function isAdmin(userId) {
  if (!userId) return false;
  const admins = loadAdmins();
  return admins.includes(userId);
}

module.exports = { isAdmin };
