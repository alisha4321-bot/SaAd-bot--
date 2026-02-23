module.exports = {
  config: {
    name: "unsendDetect",
    version: "1.1",
    author: "nai 😔",
    description: "মেসেজ ডিলিট করলে শনাক্ত করবে"
  },

  // এখানে onStart এর বদলে onEvent ব্যবহার করা হয়েছে
  onEvent: async function ({ api, event, usersData }) {
    if (event.type === "message_unsend") {
      const { threadID, senderID } = event;

      // বট নিজে আনসেন্ড করলে ইগনোর করবে
      if (senderID == api.getCurrentUserID()) return;

      try {
        const name = await usersData.getName(senderID) || "কেউ একজন";
        const msg = `নিগ্গা ${name}, এই মেসেজটি ডিলিট করেছে। 🐸`;

        return api.sendMessage(msg, threadID);
      } catch (error) {
        console.error("Unsend Detect Error:", error);
      }
    }
  }
};
