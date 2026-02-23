const axios = require("axios");

module.exports = {
  config: {
    name: "ramadan",
    aliases: ["romjan", "iftar", "sehri"],
    version: "1.2",
    author: "Saim",
    countDown: 5,
    role: 0,
    shortDescription: "Get Ramadan timing for BD Districts",
    longDescription: "Get today's Sehri and Iftar timing for any district in Bangladesh.",
    category: "islamic",
    guide: "{pn} <district_name> (Example: /ramadan sirajganj)"
  },

  onStart: async function ({ api, event, args, message }) {
    let query = args.join(" ").toLowerCase().trim();

    if (!query) {
      return message.reply("⚠️ দয়া করে একটি জেলার নাম লিখুন।\nউদাহরণ: /ramadan sirajganj");
    }

    // জেলা নামের কিছু কমন ভুল বানান বা স্পেস হ্যান্ডেল করা
    if (query.includes("sirajganj")) query = "sirajganj";
    if (query.includes("dhaka")) query = "dhaka";

    try {
      // এই API-টি বাংলাদেশের জন্য আরও বেশি কার্যকর
      const apiUrl = `https://api.aladhan.com/v1/timingsByAddress?address=${encodeURIComponent(query)},Bangladesh&method=1`;
      
      const response = await axios.get(apiUrl);
      
      if (response.data.code !== 200 || !response.data.data) {
        return message.reply("❌ জেলার নাম খুঁজে পাওয়া যায়নি। দয়া করে সঠিক ইংরেজি বানান লিখুন।");
      }

      const data = response.data.data;
      const timings = data.timings;
      const dateInfo = data.date;

      // সময়সূচী মেসেজ
      const msg = `🌙 **রমজান ও নামাজের সময়সূচী ২০২৬** 🌙\n` +
                  `--------------------------\n` +
                  `📍 স্থান: ${query.toUpperCase()}, বাংলাদেশ\n` +
                  `📅 তারিখ: ${dateInfo.readable}\n` +
                  `☪️ হিজরী: ${dateInfo.hijri.day} ${dateInfo.hijri.month.en} ${dateInfo.hijri.year}\n` +
                  `--------------------------\n` +
                  `🍲 সেহরীর শেষ সময় (Fajr): ${timings.Fajr}\n` +
                  `🌅 ইফতারের সময় (Maghrib): ${timings.Maghrib}\n` +
                  `--------------------------\n` +
                  `🕌 অন্যান্য সময়:\n` +
                  `☀️ সূর্যোদয়: ${timings.Sunrise}\n` +
                  `🕛 জোহর: ${timings.Dhuhr}\n` +
                  `🕒 আসর: ${timings.Asr}\n` +
                  `🌃 এশা: ${timings.Isha}\n\n` +
                  `📢 জেলা ভেদে ১-৩ মিনিট সময় কমবেশি হতে পারে।`;

      return message.reply(msg);

    } catch (error) {
      console.error("Ramadan API Error:", error);
      return message.reply("❌ এই মুহূর্তে তথ্য পাওয়া যাচ্ছে না। দয়া করে বানান চেক করে আবার চেষ্টা করুন। (যেমন: Sirajganj, Bogura, Dhaka)");
    }
  }
};
