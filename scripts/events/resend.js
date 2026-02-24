const fs = require("fs-extra");
const axios = require("axios");

module.exports = {
  config: {
    name: "unsendDetect",
    version: "2.5",
    author: "nai 😔",
    description: "মেসেজ আনসেন্ড করলে সাথে সাথে রিপ্লাই দিবে"
  },

  onChat: async function ({ api, event, usersData }) {
    const { messageID, senderID, threadID, body: content, type } = event;

    // ১. মেসেজ হিস্টোরি রাখার জন্য গ্লোবাল ভেরিয়েবল
    if (!global.logMessage) global.logMessage = new Map();

    // ২. মেসেজ আনসেন্ড না হওয়া পর্যন্ত সেটি সেভ করে রাখা
    if (type !== "message_unsend") {
      global.logMessage.set(messageID, {
        body: content || "",
        attachments: event.attachments || []
      });
      return;
    }

    // ৩. মেসেজ আনসেন্ড হলে কার্যকর হবে
    if (type === "message_unsend") {
      const savedMsg = global.logMessage.get(messageID);
      if (!savedMsg) return;

      if (senderID == api.getCurrentUserID()) return;

      try {
        const name = await usersData.getName(senderID) || "কেউ একজন";
        const msgBody = `নিগ্গা ${name}, এই মেসেজটি ডিলিট করেছে। 🐸\n\n${savedMsg.body ? `ডিলিট করা টেক্সট: ${savedMsg.body}` : "কোনো টেক্সট ছিল না (শুধু ছবি/ভিডিও ছিল)"}`;

        // ডিলিট করা মেসেজটি রিপ্লাই হিসেবে পাঠানো
        return api.sendMessage(msgBody, threadID);
        
      } catch (error) {
        console.error("Unsend Error:", error);
      }
    }
  }
};
                                                                      
