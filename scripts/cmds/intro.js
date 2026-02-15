const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function downloadFile(url, outPath) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(outPath, res.data);
  return outPath;
}

module.exports = {
  config: {
    name: "intro",
    version: "1.0.3",
    author: "Washiq",
    role: 0,
    category: "utility",
    shortDescription: "Send intro image",
    longDescription: "Send intro image and mention replied user",
    countDown: 0,
  },

  // ✅ Required for GoatBot installer
  onStart: async function () {
    return;
  },

  onChat: async function ({ api, event }) {
    const { threadID, body, messageReply } = event;
    if (!body) return;

    const text = body.trim().toLowerCase();
    if (text !== "intro") return;

    const imageUrl = "https://files.catbox.moe/kdkocu.jpg";

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `intro_${Date.now()}.jpg`);

    try {
      await downloadFile(imageUrl, filePath);

      
      if (messageReply) {
        const userID = messageReply.senderID;
        const userInfo = await api.getUserInfo(userID);
        const userName = userInfo[userID].name;

        await api.sendMessage(
          {
            body: `${userName}\nনতুন মুখ দেখতাছি পরিচয়টা দে আবাল ....👉🏻🤏🏻😫😫`,
            mentions: [
              {
                tag: userName,
                id: userID,
              },
            ],
            attachment: fs.createReadStream(filePath),
          },
          threadID
        );
      } else {
        
        await api.sendMessage(
          {
            attachment: fs.createReadStream(filePath),
          },
          threadID
        );
      }
    } catch (err) {
      await api.sendMessage("Failed to send the intro image.", threadID);
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  },
};
