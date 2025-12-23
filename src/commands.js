const { loadEvents, saveEvents } = require("./eventsStore");
const { normalize } = require("./text");

function findEventByKeyword(keyword, eventsMap) {
  if (!keyword) return null;
  if (eventsMap[keyword]) return { key: keyword, ...eventsMap[keyword] };

  for (const [key, ev] of Object.entries(eventsMap)) {
    const aliases = (ev.aliases || []).map(normalize);
    if (aliases.includes(keyword)) return { key, ...ev };
  }
  return null;
}

function usageCreate() {
  return [{ type: "text", text: "Usage: createEvent <keyword>\nExample: createEvent kyobashi" }];
}

function usageEditDesc() {
  return [{
    type: "text",
    text:
      "Usage:\n" +
      "- editEventDesc <keyword> <description>\n" +
      "- editEventDescJp <keyword> <description>\n\n" +
      "Example: editEventDesc kyobashi Bring snacks + drinks",
  }];
}

function helpMessage() {
  return [{
    type: "text",
    text:
      "Send `RSVP list` to see events, or `RSVP <keyword>` to get an invite.\n\n" +
      "MVP admin:\n- createEvent <keyword>\n- editEventDesc <keyword> <desc>\n- editEventDescJp <keyword> <desc>",
  }];
}

function commandsHelpMessage() {
  return [{
    type: "text",
    text:
      "🤖 Event RSVP Bot — How to use\n\n" +

      "This bot helps you get invited to event LINE groups if you’re interested but weren’t directly invited.\n\n" +

      "━━━━━━━━━━━━━━\n" +
      "📌 For everyone (DM the bot)\n" +
      "━━━━━━━━━━━━━━\n\n" +

      "🔹 RSVP list\n" +
      "→ Shows all upcoming events you can join\n" +
      "Example:\n" +
      "RSVP list\n\n" +

      "🔹 RSVP <event keyword>\n" +
      "→ Instantly get the invite link + QR code for that event’s LINE group\n" +
      "Example:\n" +
      "RSVP kyobashi\n\n" +

      "(If you didn’t get invited manually, this is the easiest way to join 👍)\n\n" +

      "━━━━━━━━━━━━━━\n" +
      "🛠 For organizers (DM the bot)\n" +
      "━━━━━━━━━━━━━━\n\n" +

      "🔹 createEvent <keyword>\n" +
      "→ Creates a new event people can RSVP to\n" +
      "Example:\n" +
      "createEvent kyobashi\n\n" +

      "🔹 editEventDesc <keyword> <description>\n" +
      "→ Sets or updates the event description (English)\n" +
      "Example:\n" +
      "editEventDesc kyobashi BBQ near Kyobashi station, Sat 7pm\n\n" +

      "🔹 editEventDescJp <keyword> <description>\n" +
      "→ Sets or updates the event description (Japanese)\n" +
      "Example:\n" +
      "editEventDescJp kyobashi 京橋でBBQ！土曜19時〜\n\n" +

      "━━━━━━━━━━━━━━\n" +
      "ℹ️ Notes\n" +
      "━━━━━━━━━━━━━━\n\n" +

      "• All commands should be sent via DM to the bot\n" +
      "• The main group stays clean — no invite links posted\n" +
      "• If you’re interested but unsure, just RSVP 👍",
  }];
}


function handleCreateEvent(rawText, eventsMap) {
  const keyword = normalize(rawText.split(/\s+/)[1] || "");
  if (!keyword) return usageCreate();

  if (eventsMap[keyword]) {
    return [{ type: "text", text: `Event "${keyword}" already exists.` }];
  }

  eventsMap[keyword] = {
    title: keyword,
    desc: "",
    descJp: "",
    joinLink: "",
    qrOriginal: "",
    qrPreview: "",
    aliases: [],
    enabled: true,
  };

  saveEvents(eventsMap);

  return [{
    type: "text",
    text:
      `✅ Created event "${keyword}".\n\nNext:\n` +
      `- editEventDesc ${keyword} <description>\n` +
      `- (later) add joinLink/QR in events.json`,
  }];
}

function handleEditEventDesc(rawText, eventsMap, { isJp }) {
  const parts = rawText.trim().split(" ");
  const keyword = normalize(parts[1] || "");
  const desc = parts.slice(2).join(" ").trim();

  if (!keyword || !desc) return usageEditDesc();

  if (!eventsMap[keyword]) {
    return [{ type: "text", text: `Event "${keyword}" does not exist. Create it first: createEvent ${keyword}` }];
  }

  const field = isJp ? "descJp" : "desc";
  eventsMap[keyword][field] = desc;

  saveEvents(eventsMap);

  return [{ type: "text", text: `✅ Updated ${field} for "${keyword}".` }];
}

function handleRsvp(rawText, eventsMap) {
  const text = normalize(rawText);
  const parts = text.split(" ");
  const second = parts[1];

  if (!second || second === "help") {
    return [{
      type: "text",
      text: "Use:\n- `RSVP list`\n- `RSVP <keyword>` (example: `RSVP kyobashi`)",
    }];
  }

  if (second === "list") {
    const keys = Object.keys(eventsMap);

    if (!keys.length) {
      return [{ type: "text", text: "No events yet. Create one with: createEvent <keyword>" }];
    }

    const lines = keys.map((k) => {
      const ev = eventsMap[k];
      const aliasStr = (ev.aliases && ev.aliases.length) ? ` (aliases: ${ev.aliases.join(", ")})` : "";
      const descStr = ev.desc ? ` — ${ev.desc}` : "";
      return `- ${k}${aliasStr}${descStr}`;
    });

    return [{
      type: "text",
      text: `Valid keywords:\n${lines.join("\n")}\n\nSend: RSVP <keyword>`,
    }];
  }

  const keyword = second;
  const ev = findEventByKeyword(keyword, eventsMap);

  if (!ev) {
    return [{ type: "text", text: `I don't recognize "${keyword}". Send \`RSVP list\` for valid keywords.` }];
  }

  const title = ev.title || ev.key;
  const link = ev.joinLink;
  const descLine = ev.desc ? `\n${ev.desc}\n` : "\n";

  const messages = [{
    type: "text",
    text:
      `✅ ${title}` +
      descLine +
      (link ? `Join link:\n${link}\n\n` : "Join link: (not set yet)\n\n") +
      `(If the link doesn't work, try the QR code below.)`,
  }];

  const hasQr =
    ev.qrOriginal &&
    ev.qrPreview &&
    ev.qrOriginal.startsWith("https://") &&
    ev.qrPreview.startsWith("https://");

  if (hasQr) {
    messages.push({
      type: "image",
      originalContentUrl: ev.qrOriginal,
      previewImageUrl: ev.qrPreview,
    });
  } else {
    messages.push({
      type: "text",
      text: "QR code is not set for this event yet (for MVP, add qrOriginal/qrPreview in events.json).",
    });
  }

  return messages;
}

/**
 * Router: returns LINE reply messages array, or null to ignore.
 */
function handleDmText(rawText) {
  const text = normalize(rawText);
  const eventsMap = loadEvents();

  if (text.startsWith("createevent ")) {
    return handleCreateEvent(rawText, eventsMap);
  }

  if (text.startsWith("editeventdescjp ")) {
    return handleEditEventDesc(rawText, eventsMap, { isJp: true });
  }

  if (text.startsWith("editeventdesc ")) {
    return handleEditEventDesc(rawText, eventsMap, { isJp: false });
  }

  if (text.startsWith("rsvp")) {
    return handleRsvp(rawText, eventsMap);
  }

  return helpMessage();
}

module.exports = {
  handleDmText,
  // exporting these is optional, but helpful for unit tests later:
  findEventByKeyword,
  handleCreateEvent,
  handleEditEventDesc,
  handleRsvp,
  commandsHelpMessage,
};
