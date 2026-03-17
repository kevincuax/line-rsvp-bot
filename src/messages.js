// src/messages.js

const messages = {
  en: {
    // ===== Generic =====
    UNKNOWN_COMMAND:
      "I didn’t recognize that command.\nSend `commands` to see what I can do.",

    // ===== Language =====
    LANGUAGE_PROMPT:
      "Welcome! 😊\nEnglish or 日本語, which do you prefer?",
    LANGUAGE_SET_EN:
      "Got it! I’ll reply in English from now on 😊",
    LANGUAGE_SET_JP:
      "了解！これから日本語で返信するね 😊",

    // ===== Help / Commands =====

    ADMIN_ONLY:
        "Sorry — this command is for admins only.",

    COMMANDS_TITLE:
      "🤖 Event RSVP Bot — How to use",

    COMMANDS_DESCRIPTION:
      "This bot helps you get invited to event LINE groups if you’re interested but weren’t directly invited.",

    COMMANDS_FOR_EVERYONE:
      "📌 For everyone (DM the bot)",

    COMMANDS_EVENTLIST:
      "eventlist\n→ Shows all upcoming events with buttons to view details or RSVP",


    COMMANDS_RSVP:
      "RSVP <event keyword>\n→ Instantly get the invite link + QR code\nExample:\nRSVP kyobashi",

    COMMANDS_DESCRIBE:
      "describe <event keyword>\n→ Shows the event details (time, place, notes)\nExample:\ndescribe kyobashi",

    COMMANDS_FOR_ORGANIZERS:
      "🛠 For organizers (DM the bot)",

    COMMANDS_CREATE_EVENT:
      "createEvent <keyword>\n→ Create a new event\nExample:\ncreateEvent kyobashi",

    COMMANDS_EDIT_DESC:
      "editEventDesc <keyword> <description>\n→ Update event description (English)",

    COMMANDS_EDIT_DESC_JP:
      "editEventDescJp <keyword> <description>\n→ Update event description (Japanese)",

    COMMANDS_EDIT_JOIN_LINK:
      "editJoinLink <keyword> <link>\n→ Update the LINE invite link",

    COMMANDS_NOTES:
      "• All commands should be sent via DM\n• The main group stays clean\n• If you’re interested but unsure, just RSVP 👍",

    // ===== Event List =====
    EVENTLIST_EMPTY:
      "No events yet. Create one with: createEvent <keyword>",

    EVENTLIST_HEADER:
      "Valid keywords:",

    EVENTLIST_FOOTER:
      "Send:\n- RSVP <keyword> → join the event\n- describe <keyword> → see details",

    // ===== RSVP =====
    RSVP_USAGE:
      "Usage:\nRSVP <keyword>\nExample: RSVP kyobashi",

    RSVP_UNKNOWN_EVENT:
      'I don’t recognize "{keyword}". Send `eventlist` to see valid events.',

    RSVP_JOIN_LINK_NOT_SET:
      "Join link is not set yet.",

    RSVP_JOIN_MESSAGE:
      "Join link:",

    RSVP_QR_FALLBACK:
      "(If the link doesn’t work, try the QR code below.)",

    // ===== Describe =====
    DESCRIBE_USAGE:
      "Usage: describe <keyword>\nExample: describe kyobashi",

    DESCRIBE_NOT_FOUND:
      'I don’t recognize "{keyword}". Send `eventlist` to see valid events.',

    DESCRIBE_EMPTY:
      "(No description yet)",

    // ===== Create Event =====
    CREATE_USAGE:
      "Usage: createEvent <keyword>\nExample: createEvent kyobashi",
    
    CREATE_KEYWORD_NO_SPACES:
      "Event keywords can’t contain spaces.\nUse something like:\n- dubai_chocolate_party\n- dubai-chocolate-party",

    CREATE_EXISTS:
      'Event "{keyword}" already exists.',

    CREATE_SUCCESS:
      '✅ Created event "{keyword}".\n\nNext:\n- editEventDesc {keyword} <description>\n- editJoinLink {keyword} <link>',

    // ===== Edit Description =====
    EDIT_DESC_USAGE:
      "Usage:\neditEventDesc <keyword> <description>\neditEventDescJp <keyword> <description>",

    EDIT_EVENT_NOT_FOUND:
      'Event "{keyword}" does not exist. Create it first: createEvent {keyword}',

    EDIT_DESC_SUCCESS:
      '✅ Updated description for "{keyword}".',

    EDIT_DESC_JP_SUCCESS:
      '✅ Updated Japanese description for "{keyword}".',

    // ===== Edit Join Link =====
    EDIT_JOIN_LINK_USAGE:
      "Usage:\neditJoinLink <keyword> <link>",

    EDIT_JOIN_LINK_SUCCESS:
      '✅ Updated join link for "{keyword}".',
  },

  jp: {
    // ===== Generic =====
    UNKNOWN_COMMAND:
      "そのコマンドは分からないよ。\n`commands` を送って確認してね。",

    // ===== Language =====
    LANGUAGE_PROMPT:
      "ようこそ 😊\nEnglish か 日本語、どちらがいい？",
    LANGUAGE_SET_EN:
      "了解！これから英語で返信するね 😊",
    LANGUAGE_SET_JP:
      "了解！これから日本語で返信するね 😊",

    // ===== Help / Commands =====

    ADMIN_ONLY:
        "ごめんね、このコマンドは管理者のみ使えます。",

    COMMANDS_TITLE:
      "🤖 Event RSVP Bot — 使い方",

    COMMANDS_DESCRIPTION:
      "このボットは、イベントに興味がある人が簡単に参加できるようにするためのものだよ。",

    COMMANDS_FOR_EVERYONE:
      "📌 みんな向け（ボットにDMしてね）",

    // ===== Help / Commands =====

    COMMANDS_EVENTLIST:
    "eventlist\n→ Shows all upcoming events with buttons to view details or RSVP",

    COMMANDS_RSVP:
      "参加 <キーワード>\n→ イベントの招待リンクとQRを取得\n例:\n参加 kyobashi",

    COMMANDS_DESCRIBE:
      "説明 <キーワード>\n→ イベントの詳細を見る\n例:\n説明 kyobashi",

    COMMANDS_CREATE_EVENT:
      "イベント作成 <キーワード>\n→ 新しいイベントを作成\n例:\nイベント作成 kyobashi",

    COMMANDS_EDIT_DESC:
      "説明編集 <キーワード> <説明>\n→ イベント説明（英語）を更新",

    COMMANDS_EDIT_DESC_JP:
      "説明編集日本語 <キーワード> <説明>\n→ イベント説明（日本語）を更新",

    COMMANDS_EDIT_JOIN_LINK:
      "参加リンク編集 <キーワード> <リンク>\n→ 招待リンクを更新",


    COMMANDS_NOTES:
      "・コマンドはすべてDMで送ってね\n・メイングループはスッキリ\n・迷ったら「参加 <キーワード>」👍",

    // ===== Event List =====
    EVENTLIST_EMPTY:
      "イベントがまだありません。\ncreateEvent <keyword> で作成してね。",

    EVENTLIST_HEADER:
      "キーワード一覧:",

    EVENTLIST_FOOTER:
      "送ってね:\n- RSVP <keyword> → 参加\n- describe <keyword> → 詳細を見る",

    // ===== RSVP =====
    RSVP_USAGE:
      "使い方:\nRSVP <キーワード>\n例: RSVP kyobashi",

    RSVP_UNKNOWN_EVENT:
      "「{keyword}」が見つかりません。\neventlist で確認してね。",

    RSVP_JOIN_LINK_NOT_SET:
      "招待リンクはまだ設定されていません。",

    RSVP_JOIN_MESSAGE:
      "参加リンク:",

    RSVP_QR_FALLBACK:
      "（リンクが開けない場合はQRコードを使ってね）",

    // ===== Describe =====
    DESCRIBE_USAGE:
      "使い方: describe <キーワード>\n例: describe kyobashi",

    DESCRIBE_NOT_FOUND:
      "「{keyword}」が見つかりません。\neventlist で確認してね。",

    DESCRIBE_EMPTY:
      "（まだ説明がありません）",

    // ===== Create Event =====
    CREATE_USAGE:
      "使い方: createEvent <キーワード>\n例: createEvent kyobashi",

    CREATE_EXISTS:
      "イベント「{keyword}」はすでに存在します。",

    CREATE_KEYWORD_NO_SPACES:
      "イベントのキーワードにスペースは使えません。\nこんな感じにしてね:\n- dubai_chocolate_party\n- dubai-chocolate-party",

    CREATE_SUCCESS:
      "✅ イベント「{keyword}」を作成しました。\n\n次にできること:\n- editEventDesc {keyword} <説明>\n- editJoinLink {keyword} <リンク>",

    // ===== Edit Description =====
    EDIT_DESC_USAGE:
      "使い方:\neditEventDesc <キーワード> <説明>\neditEventDescJp <キーワード> <説明>",

    EDIT_EVENT_NOT_FOUND:
      "イベント「{keyword}」が見つかりません。\n先に作成してね: createEvent {keyword}",

    EDIT_DESC_SUCCESS:
      "✅ イベント説明を更新しました。",

    EDIT_DESC_JP_SUCCESS:
      "✅ 日本語の説明を更新しました。",

    // ===== Edit Join Link =====
    EDIT_JOIN_LINK_USAGE:
      "使い方:\neditJoinLink <キーワード> <リンク>",

    EDIT_JOIN_LINK_SUCCESS:
      "✅ 招待リンクを更新しました。",
  },
};

module.exports = messages;
