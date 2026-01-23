module.exports = {
  config: {
    name: "adminmention",
    version: "1.3.4",
    author: "Washiq",
    countDown: 0,
    role: 0,
    shortDescription: "Replies angrily when someone tags admins",
    longDescription: "If anyone mentions an admin (tag or keyword), bot will angrily reply with random messages.",
    category: "system"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    const adminIDs = ["615506702937", "61574715983842", "615506702937"].map(String);


    const adminKeywords = [
      "@SaAd X ɆtaChi",
      "SaAd X ɆtaChi",
      "SaAd",
      "Etachi",
      "ɆtaChi",
      "saad",
      ".sad",
      "সাদ"
    ].map(s => s.toLowerCase());

    // Skip if sender is admin
    if (adminIDs.includes(String(event.senderID))) return;

    // UID mention detect
    const mentionedIDs = event.mentions ? Object.keys(event.mentions).map(String) : [];
    const isMentioningAdminByTag = adminIDs.some(id => mentionedIDs.includes(id));

    // Text match detect
    const body = (event.body || "").toLowerCase();
    const isMentioningAdminByText = adminKeywords.some(k => body.includes(k));

    if (!isMentioningAdminByTag && !isMentioningAdminByText) return;

    const REPLIES = [
      " ওরে মেনশন দিস না Alisa রে নিয়া চিপায় গেছে 😩🐸",
      "বস এক আবাল তুমারে ডাকতেছে 😂😏"
    ];

    const randomReply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    return message.reply(randomReply);
  }
};
