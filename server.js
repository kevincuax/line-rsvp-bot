require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");
const { handleDmText, commandsHelpMessage } = require("./src/commands");

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];
    await Promise.all(events.map(handleEvent));
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

async function handleEvent(event) {
  if (event.type !== "message") return;
  if (event.message?.type !== "text") return;

  const rawText = (event.message.text || "").trim();
  const text = rawText.toLowerCase();
  // ✅ ONLY respond to 1:1 DMs
  const sourceType = event.source?.type;
  if (sourceType === "group" || sourceType === "room") {
    if (text === "!commands" || text === "!help") {
      return client.replyMessage(event.replyToken, commandsHelpMessage());
    }
    return; // ignore all other group messages
  }
  
  const replyMessages = handleDmText(text);

  if (!replyMessages) return;
  return client.replyMessage(event.replyToken, replyMessages);
}

app.get("/", (req, res) => res.send("OK"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
