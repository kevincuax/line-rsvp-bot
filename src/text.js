function normalize(s) {
  return (s || "").trim().replace(/\s+/g, " ").toLowerCase();
}

module.exports = { normalize };
