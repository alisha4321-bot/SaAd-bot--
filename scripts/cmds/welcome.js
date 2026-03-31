const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "welcome",
    aliases: ["wlcm", "wl", "swagat"],
    version: "6.0",
    author: "SaAd",
    countDown: 5,
    role: 0,
    shortDescription: "Welcome someone with a custom profile overlay image",
    category: "group",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, threadsData, message }) {
    const { threadID, messageReply, mentions } = event;

    let targetID, targetName;

    try {
      if (messageReply) {
        targetID = messageReply.senderID;
        const userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name;
      } 
      else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        const userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name;
      } 
      else {
        return message.reply("🛑 Tag or reply to a user.");
      }

      const threadInfo = await threadsData.get(threadID) || {};
      const threadName = threadInfo.threadName || "Our Group";

      const catboxLink = "https://files.catbox.moe/gzqbib.jpg"; 

      const cachePath = path.join(__dirname, "cache", `welcome_${targetID}.png`);
      if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"));

      const canvas = createCanvas(1000, 500);
      const ctx = canvas.getContext("2d");

      const baseImage = await loadImage(catboxLink);
      ctx.drawImage(baseImage, 0, 0, 1000, 500);

      const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarImage = await loadImage(avatarUrl);

      ctx.save();
      ctx.beginPath();
      ctx.arc(165, 150, 115, 0, Math.PI * 2); 
      ctx.clip();
      ctx.drawImage(avatarImage, 50, 35, 230, 230);
      ctx.restore();

      ctx.fillStyle = "#000000"; 
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.fillText(targetName, 160, 310); 

      ctx.fillStyle = "#ffffff"; 
      ctx.font = "bold 38px Arial";
      ctx.textAlign = "left";
      ctx.fillText(threadName, 490, 201); 

      const buffer = canvas.toBuffer();
      fs.writeFileSync(cachePath, buffer);

      return api.sendMessage({
        body: `السلام عليكم, ${targetName}`,
        attachment: fs.createReadStream(cachePath),
        mentions: [{
          tag: targetName,
          id: targetID
        }]
      }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      });

    } catch (error) {
      console.error(error);
      return message.reply("🛑 Error occurred.");
    }
  }
};
