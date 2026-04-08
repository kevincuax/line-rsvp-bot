const { google } = require("googleapis");

function clean(value) {
  return (value || "").toString().trim();
}

function toKeyword(value) {
  return clean(value)
    .toLowerCase()
    .replace(/\s+/g, "-");
}

async function loadEventsFromGoogleSheets() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME;

  if (!serviceAccountEmail) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!privateKey) throw new Error("Missing GOOGLE_PRIVATE_KEY");
  if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");
  if (!sheetName) throw new Error("Missing GOOGLE_SHEET_NAME");

  const normalizedPrivateKey = privateKey
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n")
    .trim();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccountEmail,
      private_key: normalizedPrivateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${sheetName}'!A:Z`,
  });

  const rows = response.data.values || [];
  if (rows.length < 2) return {};

  const headers = rows[0].map(clean);
  const dataRows = rows.slice(1);

  const fieldMap = {
    title: [
      "event name", "eventname", "event name/イベント名前", "event name/イベント名前",
      "event name/イベント名前", "event name/イベントname"
    ],
    keyword: ["keyword", "event keyword", "event-keyword", "キーワード"],
    desc: ["description", "descriptionenglish", "description(english)内容（英語で）", "description(english)内容(英語で)", "description(english)", "description (english)", "内容（英語で）", "内容(英語で)", "description (english)"],
    descJp: ["descriptionjapanese", "description(japanese)　内容（日本語で）", "description(japanese) 内容（日本語で）", "description(japanese)", "description (japanese)", "descriptionjapanese", "内容（日本語で）", "内容(日本語で)", "description japanese"],
    joinLink: ["joinlink", "join link", "join link　参加するリンク", "join link 参加するリンク", "参加するリンク"],
    qr: ["qr", "qr code", "qr code url", "qr url", "qr image", "qrimage"],
    qrOriginal: ["qroriginal", "qr original", "qr-original", "original qr", "original qr code", "qr original url"],
    qrPreview: ["qrpreview", "qr preview", "qr-preview", "preview qr", "preview qr code", "qr preview url"],
    datetime: ["datetime", "date time", "date time(for ex: 2025-03-15 18:00-22:00) 日時(例：2025-03-15 18:00-22:00)", "date time(for ex: 2025-03-15 18:00-22:00) 日時(例：2025-03-15 18:00-22:00)", "date time (for ex: 2025-03-15 18:00-22:00)", "location datetime", "日時"],
    location: ["location", "location 場所", "場所"],
  };

  function canonicalHeader(value) {
    const normalized = value
      .toLowerCase()
      .replace(/[\s\u3000]+/g, " ")
      .replace(/[()\[\]{}\/、，。;:]/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .trim();

    for (const [key, aliases] of Object.entries(fieldMap)) {
      if (aliases.some((alias) => normalized === alias.toLowerCase().replace(/[^a-z0-9 ]/g, ""))) {
        return key;
      }
    }
    return normalized.replace(/ /g, "");
  }

  const mappedHeaders = headers.map(canonicalHeader);
  const eventsMap = {};

  for (const row of dataRows) {
    const record = {};
    mappedHeaders.forEach((header, i) => {
      record[header] = clean(row[i]);
    });

    const title = clean(record.title);
    const keyword = clean(record.keyword) || toKeyword(title);

    if (!keyword) continue;

    const qrOriginal = clean(record.qrOriginal || record.qr);
    const qrPreview = clean(record.qrPreview || record.qr || record.qrOriginal);

    eventsMap[keyword] = {
      title: title || keyword,
      desc: clean(record.desc),
      descJp: clean(record.descJp),
      joinLink: clean(record.joinLink),
      qrOriginal,
      qrPreview,
      datetime: clean(record.datetime),
      location: clean(record.location),
    };
  }

  return eventsMap;
}

module.exports = { loadEventsFromGoogleSheets };