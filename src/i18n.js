// i18n.js
const messages = require("./messages");

function t(lang, key, vars = {}) {
  const dict = messages[lang] || messages.en;
  let template = dict[key] || messages.en[key] || key;

  // simple {var} replacement
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? vars[k] : `{${k}}`
  );
}

module.exports = { t };
