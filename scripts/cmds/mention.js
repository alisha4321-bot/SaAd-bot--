module.exports = {
  config: {
    name: "mention",
    version: "2.0.2",
    author: "Washiq",
    countDown: 0,
    role: 0,
    shortDescription: "Auto reply on keywords",
    longDescription: "Replies when specific keywords appear in message (no UID needed).",
    category: "system"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    const body = (event.body || "").trim();
    if (!body) return;

    const TRIGGERS = [
      "@SaAd X ɆtaChi",
      "SaAd X ɆtaChi",
      "SaAd",
      "Etachi",
      "ɆtaChi",
      "Saad",
      ".saad",
      "সাদ",
      "সন্ন্যাসী",
      "saad",
      "@সন্ন্যাসী",
      "@সন্ন্যাসী 😇"
    ].map(t => t.toLowerCase());

    const text = body.toLowerCase();
    if (!TRIGGERS.some(t => text.includes(t))) return;

    const REPLIES = [
      "SaAd বস এক আবাল তোমারে ডাকতেছে 🫡",
      "SaAd বস এক আবাল তোমারে ডাকতেছে 😂😒"
    ];

    return message.reply(REPLIES[Math.floor(Math.random() * REPLIES.length)]);
  }
};
