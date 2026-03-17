require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");

const { handleDmText, commandsHelpMessage } = require("./src/commands");
const { getUserLang, setUserLang } = require("./src/userPrefsStore");
const { loadEvents } = require("./src/eventsStore");

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

/**
 * Reply safely:
 * - Ignore expired/invalid reply tokens (common / expected)
 * - Log unexpected errors
 */
async function safeReply(replyToken, messages) {
  try {
    await client.replyMessage(replyToken, messages);
  } catch (err) {
    const status =
      err?.statusCode ||
      err?.originalError?.statusCode ||
      err?.originalError?.response?.status;

    const apiMessage =
      err?.originalError?.response?.data?.message ||
      err?.originalError?.response?.data?.details?.[0]?.message ||
      err?.message;

    // ✅ Expected LINE behavior: reply tokens expire fast
    if (status === 400 && apiMessage?.toLowerCase?.().includes("invalid reply token")) {
      console.log("⚠️ Reply skipped: invalid or expired reply token");
      return;
    }

    console.error("❌ Unexpected reply error:", {
      status,
      apiMessage,
      raw: err?.originalError?.response?.data || err,
    });
  }
}

/**
 * Language prompt quick reply
 */
function languagePromptMessage() {
  return [
    {
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
    },
  ];
}

/**
 * Webhook
 */
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    console.log("received request");

    const events = req.body.events || [];
    for (const event of events) {
      const result = await handleEvent(event);
      if (result?.replyToken && result?.messages?.length) {
        await safeReply(result.replyToken, result.messages);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err?.originalError?.response?.data || err);
    res.sendStatus(500);
  }
});

/**
 * Handle a single LINE event.
 * Returns: { replyToken, messages } OR null
 */
async function handleEvent(event) {
  const sourceType = event.source?.type;

  // ---------- GROUP / ROOM ----------
  // Keep group clean: only respond to !commands / !help
  if (sourceType === "group" || sourceType === "room") {
    if (event.type === "message" && event.message?.type === "text") {
      const t = (event.message.text || "").trim().toLowerCase();
      if (t === "!commands" || t === "!help") {
        return {
          replyToken: event.replyToken,
          messages: commandsHelpMessage({ lang: "en" }),
        };
      }
    }
    return null;
  }

  // ---------- DM ONLY ----------
  const userId = event.source?.userId;
  if (!userId) return null;

  console.log("USERID:", userId);

  // ---------- FOLLOW (user added bot) ----------
  if (event.type === "follow") {
    // Optionally reset lang on re-follow
    setUserLang(userId, null);

    return {
      replyToken: event.replyToken,
      messages: languagePromptMessage(),
    };
  }

  // ---------- POSTBACK ----------
  if (event.type === "postback") {
    const data = event.postback?.data || "";

    // 1) Language selection
    if (data.startsWith("SET_LANG=")) {
      const lang = data.split("=")[1]; // "en" or "jp"
      setUserLang(userId, lang);

      return {
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text:
              lang === "jp"
                ? "了解！これから日本語で返信するね 😊"
                : "Got it! I’ll reply in English 😊",
          },
          ...commandsHelpMessage({ lang }),
        ],
      };
    }

    // 2) QuickReply / button actions from event list (postbacks)
    //    We reuse your existing router by turning these into normal commands.
    if (data && data !== "SET_LANG=en" && data !== "SET_LANG=jp") {
      const keyword = data;
      const lang = getUserLang(userId) || "en";

      const messages = handleDmText(`rsvp ${keyword}`, { lang, userId });
      return {
        replyToken: event.replyToken,
        messages: messages?.length ? messages : [{ type: "text", text: "OK" }],
      };
    }

    if (data.startsWith("RSVP:")) {
      const keyword = data.replace("RSVP:", "").trim();
      const lang = getUserLang(userId) || "en";

      const messages = handleDmText(`rsvp ${keyword}`, { lang, userId });
      return {
        replyToken: event.replyToken,
        messages: messages?.length ? messages : [{ type: "text", text: "OK" }],
      };
    }

    return null;
  }

  // ---------- TEXT ----------
  if (event.type !== "message" || event.message?.type !== "text") {
    return null;
  }

  const rawText = (event.message.text || "").trim();
  const lang = getUserLang(userId);

  // If no preference yet, ask language first
  if (!lang) {
    return {
      replyToken: event.replyToken,
      messages: languagePromptMessage(),
    };
  }

  const messages = handleDmText(rawText, { lang, userId });
  if (!messages || !messages.length) return null;

  return {
    replyToken: event.replyToken,
    messages,
  };
}

app.get('/calendar/:eventKey', (req, res) => {
  const eventKey = decodeURIComponent(req.params.eventKey);
  const eventsMap = loadEvents();
  const ev = eventsMap[eventKey];

  if (!ev || !ev.datetime) {
    res.status(404).send('Event not found or no datetime set.');
    return;
  }

  const [date, times] = ev.datetime.split(' ');
  if (!times || !times.includes('-')) {
    res.status(400).send('Invalid datetime format.');
    return;
  }

  const [start, end] = times.split('-');
  const dtstart = date.replace(/-/g, '') + 'T' + start.replace(':', '') + '00';
  const dtend = date.replace(/-/g, '') + 'T' + end.replace(':', '') + '00';

  const summary = ev.title || eventKey;
  const description = ev.desc || ev.descJp || 'Event details';

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description}
END:VEVENT
END:VCALENDAR`;

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${eventKey}.ics"`);
  res.send(ics);
});

app.get("/", (req, res) => res.send("OK"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
