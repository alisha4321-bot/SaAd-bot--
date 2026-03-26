module.exports = {
  config: {
    name: "mention",
    version: "2.0.4",
    author: "Washiq",
    countDown: 10,
    role: 0,
    category: "system",
    shortDescription: "Auto reply on keywords",
    longDescription: "Replies when specific keywords appear in message.",
    usePrefix: false
  },

  onStart: async function () {},

  onChat: async function ({ api, event, message }) {
    if (event.senderID == api.getCurrentUserID()) return;
    
    if (!event.body) return;

    const TRIGGERS = [
      "@SaAd X ɆtaChi",
      "SaAd X ɆtaChi",
      "SaAd",
      "Etachi",
      "ɆtaChi",
      "Saad",
      ".saad",
      "সাদ",
      "saad"
    ];

    const text = event.body.toLowerCase();
    
    const isMentioned = TRIGGERS.some(t => text.includes(t.toLowerCase()));

    if (isMentioned) {
      const REPLIES = [
        "SaAd বস এক আবাল তোমারে ডাকতেছে 🫡",
        "SaAd বস এক আবাল তোমারে ডাকতেছে 😂😒"
      ];

      const randomReply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
      
      return message.reply(randomReply);
    }
  }
};
