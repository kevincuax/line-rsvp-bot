const fs = require("fs");
const path = require("path");

const EVENTS_PATH = path.join(__dirname, "..", "events.json");

function loadEvents() {
  if (!fs.existsSync(EVENTS_PATH)) return {};
  const raw = fs.readFileSync(EVENTS_PATH, "utf8");
  return raw.trim() ? JSON.parse(raw) : {};
}

// MVP simple write (safe enough for now)
function saveEvents(eventsObj) {
  fs.writeFileSync(EVENTS_PATH, JSON.stringify(eventsObj, null, 2), "utf8");
}

module.exports = { loadEvents, saveEvents, EVENTS_PATH };
