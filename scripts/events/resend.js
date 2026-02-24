const fs = require("fs-extra");
const axios = require("axios");

module.exports = {
  config: {
    name: "resend",
    version: "2.6",
    author: "nai 😞",
    description: "মেসেজ আনসেন্ড করলে শনাক্ত করবে"
  },

  // এই ফাংশনটি না থাকলে 'Function onStart is missing' এরর দেখায়
  onStart: async function ({ api, event }) {
    // এটি খালি থাকলেও সমস্যা নেই
  },

  onChat: async function ({ api, event, usersData }) {
    const { messageID, senderID, threadID, body: content, type } = event;

    if (!global.logMessage) global.logMessage = new Map();

    if (type !== "message_unsend") {
      global.logMessage.set(messageID, {
        body: content || "",
        attachments: event.attachments || []
      });
      return;
    }

    if (type === "message_unsend") {
      const savedMsg = global.logMessage.get(messageID);
      if (!savedMsg) return;

      if (senderID == api.getCurrentUserID()) return;

      try {
        const name = await usersData.getName(senderID) || "কেউ একজন";
        const msgBody = `নিগ্গা ${name}, এই মেসেজটি ডিলিট করেছে। 🐸\n\n${savedMsg.body ? `ডিলিট করা টেক্সট: ${savedMsg.body}` : "কোনো টেক্সট ছিল না (শুধু ছবি/ভিডিও ছিল)"}`;

        return api.sendMessage(msgBody, threadID);
        
      } catch (error) {
        console.error("Unsend Error:", error);
      }
    }
  }
};
