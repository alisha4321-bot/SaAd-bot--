module.exports = {
  config: {
    name: "everyone",
    version: "2.1.0",
    author: "Washiq | Rafi",
    countDown: 0,
    role: 0,
    shortDescription: "Auto reply on specific keywords",
    longDescription: "Exact keyword matching for auto replies.",
    category: "system"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    const body = (event.body || "").trim().toLowerCase();
    if (!body) return;

    const TRIGGERS = [
      "@everyone ",
      "everyone",
      "everyone",
      "@everyone",
      "@everyone",
      "@everyone",
      "@everyone",
      "@everyone"
    ].map(t => t.toLowerCase());

    const isMatched = TRIGGERS.some(t => {
      const regex = new RegExp(`\\b${t}\\b`, 'i');
      return regex.test(body);
    });

    if (!isMatched) return;

    const REPLIES = [
      "খায়া দায়া কাজ নাই হুদাই @everyone মারাস আবাল 🙄🫩",
      "খায়া দায়া কাজ নাই হুদাই @everyone মারাস আবাল 🙄🫩"
    ];

    const randomReply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    return message.reply(randomReply);
  }
};
