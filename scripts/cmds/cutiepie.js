const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "cutiepie",
    aliases: ["cutiepie", "cute", "cutepie", "bandorni"], 
    version: "5.6",
    author: "SaAd", 
    countDown: 5,
    role: 0,
    usePrefix: true,
    shortDescription: "Turn a female user into a monkey with your new image!",
    category: "fun",
    guide: { en: "{pn} @mention or reply" },
  },

  onStart: async function ({ event, message, api, usersData }) {
    let targetID = event.type === "message_reply" ? event.messageReply.senderID : Object.keys(event.mentions)[0];

    // যদি মেনশন বা রিপ্লাই থাকে, তবে চেক করবে সে মেয়ে কি না
    if (targetID) {
      const uData = await usersData.get(targetID);
      if (uData.gender !== 1 && String(uData.gender).toLowerCase() !== "female") {
        return message.reply("❗ This command is only for female members! 🐒");
      }
    }

    // যদি কাউকে সিলেক্ট করা না থাকে, তবে অটোমেটিক গ্রুপ থেকে মেয়ে খুঁজবে
    if (!targetID) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participantIDs = threadInfo.participantIDs;
      let femaleIDs = [];
      for (let id of participantIDs) {
        const uData = await usersData.get(id);
        if (uData.gender === 1 || String(uData.gender).toLowerCase() === "female") {
          femaleIDs.push(id);
        }
      }
      if (femaleIDs.length === 0) return message.reply("❗ There are no female members detected! 🐒");
      targetID = femaleIDs[Math.floor(Math.random() * femaleIDs.length)];
    }

    try {
      const userData = await usersData.get(targetID);
      const targetName = userData.name || "Cute pie";

      const waitMsg = await message.reply(`⌛ Generating a Cute Pie Grill 🎀🐍`);

      let avatarUrl;
      try { avatarUrl = await usersData.getAvatarUrl(targetID); } 
      catch (e) { avatarUrl = `https://graph.facebook.com/${targetID}/picture?type=large`; }

      const avatarRes = await axios.get(avatarUrl, { responseType: "arraybuffer" });
      const avatarImage = await loadImage(Buffer.from(avatarRes.data));

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      
      const monkeyImgUrl = "https://files.catbox.moe/rvwxs7.jpg"; 
      const bgResponse = await axios.get(monkeyImgUrl, { responseType: "arraybuffer" });
      const bgImage = await loadImage(Buffer.from(bgResponse.data));

      const canvas = createCanvas(bgImage.width, bgImage.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bgImage, 0, 0);

      const avatarSize = 100; // আপনার চাহিদা মতো ১০০ রাখা হয়েছে
      const headX = (bgImage.width / 2) - (avatarSize / 2); 
      const headY = 40; 

      ctx.save();
      ctx.beginPath();
      ctx.arc(headX + avatarSize/2, headY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImage, headX, headY, avatarSize, avatarSize);
      ctx.restore();

      const outputPath = path.join(cacheDir, `bandor_${targetID}_${Date.now()}.png`);
      await fs.writeFile(outputPath, canvas.toBuffer("image/png"));

      await message.reply({
        body: `Hey My Cutepie Sister 🎀🐣\n${targetName}`,
        mentions: [{ tag: targetName, id: targetID }],
        attachment: fs.createReadStream(outputPath),
      });

      if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
      setTimeout(() => { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath) }, 5000);

    } catch (err) {
      console.error(err);
      message.reply(`❌ Something went wrong!`);
    }
  },
};
