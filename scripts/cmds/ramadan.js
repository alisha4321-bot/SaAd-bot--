const axios = require("axios");

module.exports = {
  config: {
    name: "ramadan",
    aliases: ["romjan", "iftar", "sehri"],
    version: "1.0",
    author: "SaAd",
    countDown: 5,
    role: 0,
    shortDescription: "Get Ramadan timing for any district in BD",
    longDescription: "Get today's Sehri and Iftar timing for any district in Bangladesh.",
    category: "islamic",
    guide: "{pn} <district_name> (Example: /ramadan dhaka)"
  },

  onStart: async function ({ api, event, args, message }) {
    let district = args[0];

    if (!district) {
      return message.reply("⚠️ দয়া করে একটি জেলার নাম লিখুন।\nউদাহরণ: /ramadan dhaka");
    }

    // জেলা নাম ইংরেজিতে কনভার্ট করার চেষ্টা (যদি কেউ বাংলায় লেখে)
    const districtLower = district.toLowerCase();

    try {
      // ইসলামিক তথ্যের জন্য একটি ওপেন API ব্যবহার করা হয়েছে
      const apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${districtLower}&country=Bangladesh&method=1`;
      
      const response = await axios.get(apiUrl);
      const data = response.data.data;

      if (!data) {
        return message.reply("❌ জেলার নাম খুঁজে পাওয়া যায়নি। দয়া করে সঠিক ইংরেজি নাম লিখুন।");
      }

      const timings = data.timings;
      const date = data.date.readable;
      const hijri = data.date.hijri.day + " " + data.date.hijri.month.en + " " + data.date.hijri.year;

      // সময় ফরম্যাট ঠিক করা (সেহরি সাধারণত ফজর এর আগে হয়)
      const msg = `🌙 **রমজান সময়সূচী ২০২৬** 🌙\n` +
                  `📍 জেলা: ${districtLower.toUpperCase()}\n` +
                  `📅 তারিখ: ${date}\n` +
                  `☪️ হিজরী: ${hijri}\n` +
                  `--------------------------\n` +
                  `🍲 সেহরীর শেষ সময় (Fajr): ${timings.Fajr}\n` +
                  `🌅 ইফতারের সময় (Maghrib): ${timings.Maghrib}\n` +
                  `--------------------------\n` +
                  `📢 সতর্কবার্তা: জেলা ভেদে ১-২ মিনিট কমবেশি হতে পারে। স্থানীয় মসজিদের সাথে মিলিয়ে নিন।`;

      return message.reply(msg);

    } catch (error) {
      console.error("Ramadan Error:", error);
      return message.reply("❌ তথ্য সংগ্রহ করতে সমস্যা হয়েছে। দয়া করে জেলার সঠিক ইংরেজি নাম লিখুন (যেমন: Dhaka, Rajshahi, Sylhet)।");
    }
  }
};
