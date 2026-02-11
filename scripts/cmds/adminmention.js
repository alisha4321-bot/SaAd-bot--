module.exports = {
  config: {
    name: "adminmention",
    version: "2.0.1",
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
      "saad" 
      "@সন্ন্যাসী 😇"
    ].map(t => t.toLowerCase());

    const text = body.toLowerCase();
    if (!TRIGGERS.some(t => text.includes(t))) return;

    const REPLIES = [
      "বস এক আবাল তুমারে ডাকতেছে 🫡",
      "বস এক আবাল তুমারে ডাকতেছে 😂😒"
    ];

    const randomReply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    return message.reply(randomReply);
  }
};
