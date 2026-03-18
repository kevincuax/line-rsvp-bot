const { loadEvents, saveEvents } = require("./eventsStore");
const { normalize } = require("./text");
const { t } = require("./i18n");

function msg(lang, en, jp) {
  return lang === "jp" ? jp : en;
}

// Helper: use i18n key if it exists, otherwise fall back
function tt(lang, key, vars = {}, fallbackEn = key, fallbackJp = key) {
  const result = t(lang, key, vars);
  if (result === key) {
    return msg(lang, fallbackEn, fallbackJp);
  }
  return result;
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

const COMMAND_ALIASES = {
  createevent: ["createevent", "イベント作成", "作成"],
  editeventdescjp: ["editeventdescjp", "説明編集日本語", "日本語説明編集"],
  editeventdesc: ["editeventdesc", "説明編集"],
  editjoinlink: ["editjoinlink", "参加リンク編集", "リンク編集"],
  editeventdatetime: ["editeventdatetime", "日時編集", "日時変更"],
  rsvp: ["rsvp", "参加"],
  eventlist: ["eventlist", "一覧", "イベント一覧"],
  details: ["details", "詳細", "説明"],
};

function canonicalizeCommand(rawText) {
  const trimmed = rawText.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(/\s+/);
  const cmd = normalize(parts[0]);
  const rest = parts.slice(1).join(" ");

  for (const [canonical, aliases] of Object.entries(COMMAND_ALIASES)) {
    if (aliases.map(normalize).includes(cmd)) {
      return rest ? `${canonical} ${rest}` : canonical;
    }
  }

  return normalize(trimmed);
}

/**
 * Router: returns LINE reply messages array, or null to ignore.
 */
function handleDmText(rawText, { lang = "en", userId } = {}) {
  const text = canonicalizeCommand(rawText);
  const eventsMap = loadEvents();

  if (text.startsWith("createevent ")) {
    return handleCreateEvent(text, eventsMap, { lang, userId });
  }

  if (text.startsWith("editeventdescjp ")) {
    return handleEditEventDesc(text, eventsMap, { isJp: true, lang, userId });
  }

  if (text.startsWith("editeventdesc ")) {
    return handleEditEventDesc(text, eventsMap, { isJp: false, lang, userId });
  }

  if (text.startsWith("editjoinlink")) {
    return handleEditJoinLink(text, eventsMap, { lang, userId });
  }

  if (text.startsWith("editeventdatetime ")) {
    return handleEditEventDateTime(text, eventsMap, { lang, userId });
  }

  if (text.startsWith("rsvp")) {
    return handleRsvp(text, eventsMap, { lang, userId });
  }

  if (text.startsWith("eventlist")) {
    return handleRsvpList(eventsMap, { lang, userId });
  }

  if (text.startsWith("details ")) {
    return handleDetails(text, eventsMap, { lang, userId });
  }

  return helpMessage({ lang });
}

function usageCreate(lang = "en") {
  return [{ type: "text", text: t(lang, "CREATE_USAGE") }];
}

function usageEditDesc(lang = "en") {
  return [{ type: "text", text: t(lang, "EDIT_DESC_USAGE") }];
}

function usageEditJoinLink(lang = "en") {
  return [{ type: "text", text: t(lang, "EDIT_JOIN_LINK_USAGE") }];
}

function usageEditEventDateTime(lang = "en") {
  return [{
    type: "text",
    text: tt(
      lang,
      "EDIT_DATETIME_USAGE",
      {},
      "Usage:\neditEventDateTime <keyword> <YYYY-MM-DD HH:MM-HH:MM>\n\nExample:\neditEventDateTime kyobashi 2025-03-15 18:00-22:00",
      "使い方:\neditEventDateTime <キーワード> <YYYY-MM-DD HH:MM-HH:MM>\n\n例:\neditEventDateTime kyobashi 2025-03-15 18:00-22:00"
    ),
  }];
}

function helpMessage({ lang = "en" } = {}) {
  return [{ type: "text", text: t(lang, "UNKNOWN_COMMAND") }];
}

function commandsHelpMessage({ lang = "en" } = {}) {
  const text = [
    t(lang, "COMMANDS_TITLE"),
    "",
    t(lang, "COMMANDS_DESCRIPTION"),
    "",
    t(lang, "COMMANDS_FOR_EVERYONE"),
    "",
    t(lang, "COMMANDS_EVENTLIST"),
    "",
    t(lang, "COMMANDS_RSVP"),
    "",
    t(lang, "COMMANDS_DESCRIBE"),
    "",
    t(lang, "COMMANDS_FOR_ORGANIZERS"),
    "",
    t(lang, "COMMANDS_CREATE_EVENT"),
    "",
    t(lang, "COMMANDS_EDIT_DESC"),
    "",
    t(lang, "COMMANDS_EDIT_DESC_JP"),
    "",
    t(lang, "COMMANDS_EDIT_JOIN_LINK"),
    "",
    t(lang, "COMMANDS_NOTES"),
  ].join("\n");

  return [{ type: "text", text }];
}

function handleCreateEvent(rawText, eventsMap, { lang = "en" } = {}) {
  const keyword = normalize(rawText.split(/\s+/)[1] || "");
  if (!keyword) return usageCreate(lang);

  if (keyword.includes(" ")) {
    return [{ type: "text", text: t(lang, "CREATE_KEYWORD_NO_SPACES") }];
  }

  if (eventsMap[keyword]) {
    return [{ type: "text", text: t(lang, "CREATE_EXISTS", { keyword }) }];
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
    text: t(lang, "CREATE_SUCCESS", { keyword }),
  }];
}

function handleEditEventDesc(rawText, eventsMap, { isJp, lang = "en" } = {}) {
  const parts = rawText.trim().split(" ");
  const keyword = normalize(parts[1] || "");
  const desc = parts.slice(2).join(" ").trim();

  if (!keyword || !desc) return usageEditDesc(lang);

  if (!eventsMap[keyword]) {
    return [{ type: "text", text: t(lang, "EDIT_EVENT_NOT_FOUND", { keyword }) }];
  }

  const field = isJp ? "descJp" : "desc";
  eventsMap[keyword][field] = desc;

  saveEvents(eventsMap);

  return [{
    type: "text",
    text: t(lang, isJp ? "EDIT_DESC_JP_SUCCESS" : "EDIT_DESC_SUCCESS", { keyword }),
  }];
}

function handleEditJoinLink(rawText, eventsMap, { lang = "en" } = {}) {
  const parts = rawText.trim().split(/\s+/);
  const keyword = normalize(parts[1] || "");
  const link = parts.slice(2).join(" ").trim();

  if (!keyword || !link) {
    return usageEditJoinLink(lang);
  }

  if (!eventsMap[keyword]) {
    return [{ type: "text", text: t(lang, "EDIT_EVENT_NOT_FOUND", { keyword }) }];
  }

  eventsMap[keyword].joinLink = link;
  saveEvents(eventsMap);

  return [{
    type: "text",
    text: t(lang, "EDIT_JOIN_LINK_SUCCESS", { keyword }),
  }];
}

function handleEditEventDateTime(rawText, eventsMap, { lang = "en" } = {}) {
  const parts = rawText.trim().split(/\s+/);
  const keyword = normalize(parts[1] || "");
  const datetime = parts.slice(2).join(" ").trim();

  if (!keyword || !datetime) {
    return usageEditEventDateTime(lang);
  }

  if (!eventsMap[keyword]) {
    return [{ type: "text", text: t(lang, "EDIT_EVENT_NOT_FOUND", { keyword }) }];
  }

  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}-\d{2}:\d{2}$/.test(datetime)) {
    return [{
      type: "text",
      text: tt(
        lang,
        "EDIT_DATETIME_INVALID",
        {},
        "Invalid datetime format. Use YYYY-MM-DD HH:MM-HH:MM, e.g., 2025-03-15 18:00-22:00.",
        "日時の形式が正しくありません。YYYY-MM-DD HH:MM-HH:MM を使ってね。例: 2025-03-15 18:00-22:00"
      ),
    }];
  }

  eventsMap[keyword].datetime = datetime;
  saveEvents(eventsMap);

  return [{
    type: "text",
    text: tt(
      lang,
      "EDIT_DATETIME_SUCCESS",
      { keyword, datetime },
      `✅ Updated datetime for "${keyword}" to ${datetime}.`,
      `✅ 「${keyword}」の日時を ${datetime} に更新しました。`
    ),
  }];
}

function handleRsvp(rawText, eventsMap, { lang = "en" } = {}) {
  const text = normalize(rawText);
  const parts = text.split(" ");
  const second = parts[1];

  if (!second || second === "help") {
    return [{ type: "text", text: t(lang, "RSVP_USAGE") }];
  }

  const keyword = second;
  const ev = findEventByKeyword(keyword, eventsMap);

  if (!ev) {
    return [{
      type: "text",
      text: t(lang, "RSVP_UNKNOWN_EVENT", { keyword }),
    }];
  }

  const title = ev.title || ev.key;
  const link = ev.joinLink;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const icsUrl = `${baseUrl}/calendar/${encodeURIComponent(ev.key)}`;
  const googleCalendarUrl = buildGoogleCalendarLink(ev);

  const joinBlock = link
    ? `${t(lang, "RSVP_JOIN_MESSAGE")}\n${link}\n\n`
    : `${t(lang, "RSVP_JOIN_LINK_NOT_SET")}\n\n`;

  const calendarBlock = ev.datetime
    ? msg(
        lang,
        `Add to Calendar:\n` +
          (googleCalendarUrl ? `Google Calendar:\n${googleCalendarUrl}\n\n` : "") +
          `Apple Calendar (.ics):\n${icsUrl}\n\n`,
        `カレンダーに追加:\n` +
          (googleCalendarUrl ? `Googleカレンダー:\n${googleCalendarUrl}\n\n` : "") +
          `Apple Calendar (.ics):\n${icsUrl}\n\n`
      )
    : "";

  const messages = [{
    type: "text",
    text:
      `✅ ${title}\n\n` +
      (ev.datetime ? `📅 ${ev.datetime}\n\n` : "") +
      joinBlock +
      calendarBlock +
      t(lang, "RSVP_QR_FALLBACK"),
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
    return [{ type: "text", text: t(lang, "DESCRIBE_USAGE") }];
  }

  const ev = findEventByKeyword(keyword, eventsMap);

  if (!ev) {
    return [{
      type: "text",
      text: t(lang, "DESCRIBE_NOT_FOUND", { keyword }),
    }];
  }

  const title = ev.title || ev.key;
  const descEn = ev.desc || "";
  const descJp = ev.descJp || "";

  const desc =
    lang === "jp"
      ? (descJp || t(lang, "DESCRIBE_EMPTY"))
      : (descEn || t(lang, "DESCRIBE_EMPTY"));

  const dateStr = ev.datetime ? `📅 ${ev.datetime}\n\n` : "";

  return [{
    type: "text",
    text: `📝 ${title}\n\n${dateStr}${desc}`,
  }];
}

function handleRsvpList(eventsMap, { lang = "en" } = {}) {
  const keys = Object.keys(eventsMap);

  if (!keys.length) {
    return [{ type: "text", text: t(lang, "EVENTLIST_EMPTY") }];
  }

  const chunkSize = 10;
  const templateMessages = [];

  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);

    const columns = chunk.map((k) => {
      const ev = eventsMap[k];
      const desc =
        lang === "jp"
          ? (ev.descJp || ev.desc || t(lang, "DESCRIBE_EMPTY"))
          : (ev.desc || ev.descJp || t(lang, "DESCRIBE_EMPTY"));

      const datetimeStr = ev.datetime ? `📅 ${ev.datetime}\n` : "";

      return {
        title: k,
        text: `${datetimeStr}${desc}`.slice(0, 60),
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
        columns,
      },
    });
  }

  return templateMessages;
}

function languagePromptMessage() {
  return [{
    type: "text",
    text: t("en", "LANGUAGE_PROMPT"),
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
  findEventByKeyword,
  handleCreateEvent,
  handleEditEventDesc,
  handleEditEventDateTime,
  handleRsvp,
  commandsHelpMessage,
  languagePromptMessage,
};