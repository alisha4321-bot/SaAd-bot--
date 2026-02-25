const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "rsend",
    version: "3.0",
    author: "SaAd & Gemini",
    description: "Recover unsent messages and media"
  },

  onStart: async function ({ api, event }) {
  },

  onChat: async function ({ api, event, usersData }) {
    const { messageID, senderID, threadID, body: content, type, attachments } = event;

    if (!global.logMessage) global.logMessage = new Map();

    if (type !== "message_unsend") {
      global.logMessage.set(messageID, {
        body: content || "",
        attachments: attachments || []
      });
      return;
    }

    if (type === "message_unsend") {
      const savedMsg = global.logMessage.get(messageID);
      if (!savedMsg || senderID == api.getCurrentUserID()) return;

      try {
        const name = await usersData.getName(senderID) || "Someone";
        let msgBody = `${name}, নিগ্গা 🙏🐸 delete a massage\n\n${savedMsg.body ?`#: ${savedMsg.body}` : ""}`;

        const streams = [];
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        for (const attachment of savedMsg.attachments) {
          const ext = attachment.type === "photo" ? "jpg" : 
                      attachment.type === "video" ? "mp4" : 
                      attachment.type === "audio" ? "mp3" : "bin";
          
          const filePath = path.join(cacheDir, `${Date.now()}_${attachment.ID}.${ext}`);
          const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
          fs.writeFileSync(filePath, Buffer.from(response.data));
          streams.push(fs.createReadStream(filePath));
        }

        await api.sendMessage({
          body: msgBody,
          attachment: streams
        }, threadID);

        streams.forEach(stream => {
          if (fs.existsSync(stream.path)) fs.unlinkSync(stream.path);
        });

      } catch (error) {
        console.error("Unsend Recovery Error:", error);
      }
    }
  }
};
