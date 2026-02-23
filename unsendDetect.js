module.exports = {
  config: {
    name: "unsendDetect",
    version: "1.1",
    author: "nai 😔",
    description: "মেসেজ ডিলিট করলে শনাক্ত করবে"
  },

  onStart: async function ({ api, event, usersData }) {
    // ইভেন্ট টাইপ চেক করা হচ্ছে
    if (event.type === "message_unsend") {
      const { threadID, senderID } = event;

      // যদি বট নিজে মেসেজ আনসেন্ড করে তবে এটি কাজ করবে না
      if (senderID == api.getCurrentUserID()) return;

      try {
        // ইউজারের নাম সংগ্রহ
        const name = await usersData.getName(senderID) || "কেউ একজন";

        // মেসেজ বডি
        const msg = `নিগ্গা ${name}, এই মেসেজটি ডিলিট করেছে। 🐸`;

        // মেসেজ পাঠানো
        return api.sendMessage(msg, threadID);
        
      } catch (error) {
        console.error("Unsend Detect Error:", error);
      }
    }
  }
};
