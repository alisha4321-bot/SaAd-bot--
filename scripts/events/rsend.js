const path = require("path");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "rsend",
    version: "3.3",
    author: "SaAd & Gemini",
    description: "Recover unsent messages"
  },

  onStart: async function ({ api, event }) { },

  onChat: async function ({ api, event, usersData }) {
    const { messageID, senderID, threadID, body: content, type, attachments } = event;

    // মডিউল চেক (গিটহাবের জন্য জরুরি)
    let axios;
    try {
      axios = require("axios");
    } catch (e) {
      return; // মডিউল না থাকলে এরর দিবে না, চুপ থাকবে
    }

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
        let msgBody = `নিগ্গা 🐸🙏 ${name}, delete a message\n\n${savedMsg.body ? `#: ${savedMsg.body}` : ""}`;

        const streams = [];
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

        for (const attachment of savedMsg.attachments) {
          try {
            const ext = attachment.type === "photo" ? "jpg" : 
                        attachment.type === "video" ? "mp4" : 
                        attachment.type === "audio" ? "mp3" : "bin";
            
            const filePath = path.join(cacheDir, `${Date.now()}_${attachment.ID}.${ext}`);
            const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
            fs.writeFileSync(filePath, Buffer.from(response.data));
            streams.push(fs.createReadStream(filePath));
          } catch (e) { continue; }
        }

        await api.sendMessage({ body: msgBody, attachment: streams }, threadID);

        setTimeout(() => {
          streams.forEach(stream => { if (fs.existsSync(stream.path)) fs.unlinkSync(stream.path); });
        }, 5000);

      } catch (error) {
        console.error("Unsend Error:", error);
      }
    }
  }
};
