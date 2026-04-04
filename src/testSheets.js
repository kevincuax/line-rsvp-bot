require("dotenv").config();

const { google } = require("googleapis");

(async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY
          .replace(/^"|"$/g, "")
          .replace(/\\n/g, "\n")
          .trim(),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `'${process.env.GOOGLE_SHEET_NAME}'!A:Z`,
    });

    console.log(JSON.stringify(response.data.values, null, 2));
  } catch (err) {
    console.error("Failed to load sheet:", err);
  }
})();