/**
 * @file resend.js
 * @description ডিলিট হওয়া মেসেজ শনাক্ত এবং পুনরুদ্ধার করার স্ক্রিপ্ট
 */

module.exports = {
  config: {
    name: "resend",
    version: "1.1.0",
    author: "nai 😔",
    category: "events"
  },

  // মেসেজ আসার সাথে সাথে তা সাময়িকভাবে মেমরিতে জমা রাখা হয় [1]
  onChat: async function ({ message }) {
    if (!global.resendCache) global.resendCache = new Map();
    
    global.resendCache.set(message.messageID, {
      body: message.body,
      senderID: message.senderID
    });

    // বটের মেমরি বা র‍্যাম পরিষ্কার রাখতে ১ ঘণ্টা পর মেসেজটি ক্যাশ থেকে ডিলিট করে দেওয়া হয়
    setTimeout(() => {
      global.resendCache.delete(message.messageID);
    }, 3600000); 
  },

  // ইভেন্ট হ্যান্ডলার যা মেসেজ ডিলিট বা আনসেন্ড হওয়া শনাক্ত করে [1]
  onStart: async function ({ api, event, usersData }) {
    if (event.type == "message_unsend") {
      // ডিলিট হওয়া মেসেজটির আইডি দিয়ে ক্যাশ থেকে তথ্য খোঁজা হয়
      const cacheData = global.resendCache?.get(event.messageID);
      
      if (cacheData) {
        const { senderID, body } = cacheData;
        
        // ডিলিটকারীর নাম সংগ্রহ করা [2]
        const userData = await usersData.get(senderID);
        const name = userData.name;

        // নির্দিষ্ট ব্যক্তিকে মেনশন করে ডিলিট করা মেসেজটি গ্রুপে পাঠানো [2]
        api.sendMessage({
          body: `${name}, আপনি এই মেসেজটি ডিলিট করেছেন: "${body |

| "কোনো টেক্সট নেই (মিডিয়া ফাইল হতে পারে)"}"`,
          mentions:
        }, event.threadID);
      }
    }
  }
};
