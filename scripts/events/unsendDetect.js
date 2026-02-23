module.exports = {
  config: {
    name: "unsendDetect",
    version: "2.0",
    author: "nai 😔",
    description: "মেসেজ আনসেন্ড করলে ডিটেক্ট করবে"
  },

  onEvent: async function ({ api, event }) {
    // শুধুমাত্র মেসেজ আনসেন্ড হলে কাজ করবে
    if (event.type === "message_unsend") {
      const { threadID, senderID } = event;

      // বট নিজে আনসেন্ড করলে কিছু করবে না
      if (senderID == api.getCurrentUserID()) return;

      try {
        // ইউজারের নাম সরাসরি API থেকে নেওয়া হচ্ছে
        const userInfo = await api.getUserInfo(senderID);
        const name = userInfo[senderID]?.name || "কেউ একজন";

        // আপনার চাওয়া মেসেজ
        const msg = `নিগ্গা ${name}, এই মেসেজটি ডিলিট করেছে। 🐸`;

        return api.sendMessage(msg, threadID);
      } catch (err) {
        console.error("Unsend Error:", err);
      }
    }
  }
};
