const { loadEvents, saveEvents } = require("./eventsStore");
const { normalize } = require("./text");

function msg(lang, en, jp) {
  return lang === "jp" ? jp : en;
}

function findEventByKeyword(keyword, eventsMap) {
  if (!keyword) return null;
  if (eventsMap[keyword]) return { key: keyword, ...eventsMap[keyword] };

  for (const [key, ev] of Object.entries(eventsMap)) {
    const aliases = (ev.aliases || []).map(normalize);
    if (aliases.includes(keyword)) return { key, ...ev };
  }
  return null;
}

/**
 * Router: returns LINE reply messages array, or null to ignore.
 */
function handleDmText(rawText, { lang = "en", userId } = {}) {
  
  const text = normalize(rawText);
  const eventsMap = loadEvents();
  // return languagePromptMessage();

  if (text.startsWith("createevent ")) {
    return handleCreateEvent(rawText, eventsMap);
  }

  if (text.startsWith("editeventdescjp ")) {
    return handleEditEventDesc(rawText, eventsMap, { isJp: true });
  }

  if (text.startsWith("editeventdesc ")) {
    return handleEditEventDesc(rawText, eventsMap, { isJp: false });
  }

  if (text.startsWith("editjoinlink")) {
    return handleEditJoinLink(rawText, eventsMap);
  }

  if (text.startsWith("editeventdatetime ")) {
    return handleEditEventDateTime(rawText, eventsMap);
  }

  if (text.startsWith("rsvp")) {
    return handleRsvp(rawText, eventsMap);
  }
  

  if (text.startsWith("eventlist")) {
    return handleRsvpList(eventsMap, { lang });
  }

  if (text.startsWith("details ")) {
    return handleDetails(rawText, eventsMap, { lang });
  }

  return helpMessage();
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

function usageEditEventDateTime() {
  return [{
    type: "text",
    text:
      "Usage:\n" +
      "editEventDateTime <keyword> <YYYY-MM-DD HH:MM-HH:MM>\n\n" +
      "Example:\n" +
      "editEventDateTime kyobashi 2025-03-15 18:00-22:00",
  }];
}

function helpMessage() {
  return [{
    type: "text",
    text:
      "Send `RSVP list` to see events, or `RSVP <keyword>` to get an invite.\n\n" +
      "MVP admin:\n- createEvent <keyword>\n- editEventDesc <keyword> <desc>\n- editEventDescJp <keyword> <desc>\n- editEventDateTime <keyword> <YYYY-MM-DD HH:MM-HH:MM>",
  }];
}

function commandsHelpMessage({ lang = "en" } = {}) {
  if (lang === "jp") {
    return [{
      type: "text",
      text:
        "🤖 イベント参加ボット — 使い方\n\n" +

        "このボットは、直接招待されていなくても、興味のあるイベントのLINEグループに参加できるようにするためのものです。\n\n" +

        "━━━━━━━━━━━━━━\n" +
        "📌 一般ユーザー（ボットにDM）\n" +
        "━━━━━━━━━━━━━━\n\n" +

        "🔹 RSVP list\n" +
        "→ 参加できるイベント一覧を表示\n" +
        "例:\n" +
        "RSVP list\n\n" +

        "🔹 RSVP <イベントキーワード>\n" +
        "→ 該当イベントのLINEグループ招待リンク＋QRコードを取得\n" +
        "例:\n" +
        "RSVP kyobashi\n\n" +

        "（招待されていなくても、これが一番簡単な参加方法です 👍）\n\n" +

        "━━━━━━━━━━━━━━\n" +
        "🛠 主催者向け（ボットにDM）\n" +
        "━━━━━━━━━━━━━━\n\n" +

        "🔹 createEvent <キーワード>\n" +
        "→ 新しいイベントを作成\n" +
        "例:\n" +
        "createEvent kyobashi\n\n" +

        "🔹 editEventDesc <キーワード> <説明>\n" +
        "→ イベントの説明（英語）を設定/更新\n" +
        "例:\n" +
        "editEventDesc kyobashi BBQ near Kyobashi station, Sat 7pm\n\n" +

        "🔹 editEventDescJp <キーワード> <説明>\n" +
        "→ イベントの説明（日本語）を設定/更新\n" +
        "例:\n" +
        "editEventDescJp kyobashi 京橋でBBQ！土曜19時〜\n\n" +

        "🔹 editEventDateTime <キーワード> <YYYY-MM-DD HH:MM-HH:MM>\n" +
        "→ イベントの日時を設定/更新\n" +
        "例:\n" +
        "editEventDateTime kyobashi 2025-03-15 18:00-22:00\n\n" +

        "━━━━━━━━━━━━━━\n" +
        "ℹ️ 注意\n" +
        "━━━━━━━━━━━━━━\n\n" +

        "• すべてのコマンドはボットへのDMで送ってください\n" +
        "• メイングループには招待リンクは投稿されません\n" +
        "• 少しでも興味があれば、とりあえずRSVPしてOK 👍",
    }];
  }

  // Default: English
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

      "🔹 editEventDateTime <keyword> <YYYY-MM-DD HH:MM-HH:MM>\n" +
      "→ Sets or updates the event date and time\n" +
      "Example:\n" +
      "editEventDateTime kyobashi 2025-03-15 18:00-22:00\n\n" +

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
    datetime: "",
  };

  saveEvents(eventsMap);

  return [{
    type: "text",
    text:
      `✅ Created event "${keyword}".\n\nNext:\n` +
      `- editEventDesc ${keyword} <description>\n` +
      `- editEventDateTime ${keyword} <YYYY-MM-DD HH:MM-HH:MM>\n` +
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
function usageEditJoinLink() {
  return [{
    type: "text",
    text:
      "Usage:\n" +
      "editJoinLink <keyword> <link>\n\n" +
      "Example:\n" +
      "editJoinLink kyobashi https://line.me/R/ti/g/xxxx",
  }];
}

function handleEditJoinLink(rawText, eventsMap) {
  const parts = rawText.trim().split(/\s+/);
  const keyword = normalize(parts[1] || "");
  const link = parts.slice(2).join(" ").trim();

  if (!keyword || !link) {
    return usageEditJoinLink();
  }

  if (!eventsMap[keyword]) {
    return [{
      type: "text",
      text: `Event "${keyword}" does not exist. Create it first: createEvent ${keyword}`,
    }];
  }

  eventsMap[keyword].joinLink = link;
  saveEvents(eventsMap);

  return [{
    type: "text",
    text: `✅ Updated join link for "${keyword}".`,
  }];
}

function handleEditEventDateTime(rawText, eventsMap) {
  const parts = rawText.trim().split(/\s+/);
  const keyword = normalize(parts[1] || "");
  const datetime = parts.slice(2).join(" ").trim();

  if (!keyword || !datetime) {
    return usageEditEventDateTime();
  }

  if (!eventsMap[keyword]) {
    return [{
      type: "text",
      text: `Event "${keyword}" does not exist. Create it first: createEvent ${keyword}`,
    }];
  }

  // Basic datetime validation (YYYY-MM-DD HH:MM-HH:MM)
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}-\d{2}:\d{2}$/.test(datetime)) {
    return [{
      type: "text",
      text: `Invalid datetime format. Use YYYY-MM-DD HH:MM-HH:MM, e.g., 2025-03-15 18:00-22:00.`,
    }];
  }

  eventsMap[keyword].datetime = datetime;
  saveEvents(eventsMap);

  return [{
    type: "text",
    text: `✅ Updated datetime for "${keyword}" to ${datetime}.`,
  }];
}

function handleRsvp(rawText, eventsMap) {
  const text = normalize(rawText);
  const parts = text.split(" ");
  const second = parts[1];

  if (!second || second === "help") {
    return [{
      type: "text",
      text: "Use:\n- `RSVP <keyword>` (example: `RSVP kyobashi`)\n\nTo see events: `RSVP list`",
    }];
  }

  const keyword = second;
  const ev = findEventByKeyword(keyword, eventsMap);

  if (!ev) {
    return [{
      type: "text",
      text: `I don't recognize "${keyword}". Send \`RSVP list\` for valid keywords.`,
    }];
  }

  const title = ev.title || ev.key;
  const link = ev.joinLink;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const icsUrl = `${baseUrl}/calendar/${encodeURIComponent(ev.key)}`;
  const googleCalendarUrl = buildGoogleCalendarLink(ev);

  const messages = [{
    type: "text",
    text:
      `✅ ${title}\n\n` +
      (ev.datetime ? `📅 ${ev.datetime}\n\n` : "") +
      (link
        ? `Join link:\n${link}\n\n`
        : "Join link: (not set yet)\n\n") +
      (ev.datetime
        ? `Add to CalenDWADWADAWDAWDdar:\n` +
          (googleCalendarUrl ? `Google Calendar:\n${googleCalendarUrl}\n\n` : "") +
          `Apple / ICS:\n${icsUrl}\n\n`
        : "") +
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
  }

  return messages;
}

function buildGoogleCalendarLink(ev) {
  if (!ev?.datetime) return null;

  const [date, times] = ev.datetime.split(" ");
  if (!date || !times || !times.includes("-")) return null;

  const [start, end] = times.split("-");
  if (!start || !end) return null;

  const startStr = `${date.replace(/-/g, "")}T${start.replace(":", "")}00`;
  const endStr = `${date.replace(/-/g, "")}T${end.replace(":", "")}00`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title || ev.key || "Event",
    dates: `${startStr}/${endStr}`,
    details: ev.desc || ev.descJp || "Event details",
  });

  if (ev.location) {
    params.set("location", ev.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function handleDetails(rawText, eventsMap, { lang = "en" } = {}) {
  const parts = rawText.trim().split(/\s+/);
  const keyword = normalize(parts[1] || "");

  if (!keyword) {
    return [{
      type: "text",
      text: msg(
        lang,
        "Usage: details <keyword>\nExample: details kyobashi",
        "使い方: details <keyword>\n例: details kyobashi"
      ),
    }];
  }

  const ev = findEventByKeyword(keyword, eventsMap);

  if (!ev) {
    return [{
      type: "text",
      text: msg(
        lang,
        `I don't recognize "${keyword}". Send \`RSVP list\` for valid keywords.`,
        `「${keyword}」が見つかりません。\`RSVP list\`で確認してね。`
      ),
    }];
  }

  const title = ev.title || ev.key;
  const descEn = ev.desc || "";
  const descJp = ev.descJp || "";

  // Choose description based on language
  const desc =
    lang === "jp"
      ? (descJp || "（日本語の説明はまだありません）")
      : (descEn || "(No description yet)");

  const dateStr = ev.datetime ? `📅 ${ev.datetime}\n\n` : '';

  return [{
    type: "text",
    text: `📝 ${title}\n\n${dateStr}${desc}`,
  }];
}

function handleRsvpList(eventsMap, { lang = "en" } = {}) {
  const keys = Object.keys(eventsMap);

  if (!keys.length) {
    return [{
      type: "text",
      text: msg(
        lang,
        "No events yet. Create one with: createEvent <keyword>",
        "イベントがまだありません。作成: createEvent <keyword>"
      ),
    }];
  }

  const chunkSize = 10;
  const templateMessages = [];
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    const columns = chunk.map((k) => {
      const ev = eventsMap[k];
      const desc = lang === "jp" ? (ev.descJp || ev.desc || "No description") : (ev.desc || ev.descJp || "No description");
      const datetimeStr = ev.datetime ? `📅 ${ev.datetime}\n` : '';
      return {
        title: k,
        text: `${datetimeStr}${desc}`,
        actions: [{
          type: "postback",
          label: msg(lang, "RSVP", "参加"),
          data: k,
        }],
      };
    });
    templateMessages.push({
      type: "template",
      altText: `Event RSVP carousel ${Math.floor(i / chunkSize) + 1}`,
      template: {
        type: "carousel",
        columns: columns,
      },
    });
  }

  return templateMessages;
}

function languagePromptMessage() {
  return [{
    type: "text",
    text: "Welcome! 😊\nEnglish or 日本語, which do you prefer?",
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "postback",
            label: "English",
            data: "SET_LANG=en",
            displayText: "English",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "日本語",
            data: "SET_LANG=jp",
            displayText: "日本語",
          },
        },
      ],
    },
  }];
}


module.exports = {
  handleDmText,
  // exporting these is optional, but helpful for unit tests later:
  findEventByKeyword,
  handleCreateEvent,
  handleEditEventDesc,
  handleEditEventDateTime,
  handleRsvp,
  commandsHelpMessage,
  languagePromptMessage,
};
