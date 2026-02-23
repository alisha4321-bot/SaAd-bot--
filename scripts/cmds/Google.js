const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "google",
    aliases: ["img", "image"],
    version: "1.0",
    author: "nai 😔",
    countDown: 5,
    role: 0,
    shortDescription: "Search images from Google",
    longDescription: "Search and download images from Google based on your query.",
    category: "tools",
    guide: "{pn} <query> - Search images\nExample: {pn} nature"
  },

  onStart: async function ({ api, event, args, message }) {
    const query = args.join(" ");
    if (!query) {
      return message.reply("⚠️ দয়া করে কী লিখে সার্চ করবেন তা জানান।\nউদাহরণ: /google blue sky");
    }

    const searchingMsg = await message.reply(`🔍 "${query}" এর ছবি খোঁজা হচ্ছে...`);

    try {
      // একটি ফ্রি ইমেজ সার্চ API ব্যবহার করা হয়েছে
      const res = await axios.get(`https://sensui-useless-apis.vercel.app/googleimage?query=${encodeURIComponent(query)}`);
      const data = res.data.result;

      if (!data || data.length === 0) {
        return message.reply("❌ কোনো ছবি খুঁজে পাওয়া যায়নি।");
      }

      // প্রথম ৪টি ছবি নেওয়া হচ্ছে
      const imagesToDownload = data.slice(0, 4);
      const attachment = [];
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      for (let i = 0; i < imagesToDownload.length; i++) {
        const filePath = path.join(cacheDir, `img_${Date.now()}_${i}.jpg`);
        const imgRes = await axios.get(imagesToDownload[i], { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, Buffer.from(imgRes.data));
        attachment.push(fs.createReadStream(filePath));
        
        // ফাইলটি পাঠানোর পর ডিলিট করার জন্য শিডিউল
        setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 10000);
      }

      api.unsendMessage(searchingMsg.messageID);

      return message.reply({
        body: `✅ "${query}" এর রেজাল্ট:`,
        attachment: attachment
      });

    } catch (error) {
      console.error("Google Image Search Error:", error);
      api.unsendMessage(searchingMsg.messageID);
      return message.reply("❌ ছবি লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    }
  }
};
