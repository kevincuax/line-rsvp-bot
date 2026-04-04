require("dotenv").config();

const { loadEventsFromGoogleSheets } = require("./googleSheetEvents");

let cachedEvents = null;
let cacheExpiresAt = 0;

async function loadEvents() {
  const now = Date.now();

  if (cachedEvents && now < cacheExpiresAt) {
    return cachedEvents;
  }

  cachedEvents = await loadEventsFromGoogleSheets();
  cacheExpiresAt = now + 30 * 1000; // 30 sec cache for local testing

  return cachedEvents;
}

function saveEvents(_eventsMap) {
  // No-op for now.
  // Google Form / Sheet is the source of truth.
  return;
}

module.exports = { loadEvents, saveEvents };