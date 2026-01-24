-cmd install intro.js const axios = require("axios");
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
    version: "1.0.1",
    author: "Washiq",
    role: 0,
    category: "utility",
    shortDescription: "Send intro image without prefix",
    longDescription: "Sends a preset image when someone types intro (no prefix)",
    countDown: 0,
  },

  // ✅ Required by GoatBot v2 installer
  onStart: async function ({ api, event }) {
    // If someone uses prefix command, you can optionally send the image too:
    // Example: /intro
    const { threadID } = event;
    return api.sendMessage("Type 'intro' without prefix to get the intro image.", threadID);
  },

  // ✅ No prefix needed
  onChat: async function ({ api, event }) {
    const { threadID, body } = event;
    if (!body) return;

    const text = body.trim().toLowerCase();
    if (text !== "intro") return;

    const imageUrl = "https://files.catbox.moe/kdkocu.jpg";

    const cacheDir = path.join(__dirname, "cache");
    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    } catch {}

    const filePath = path.join(cacheDir, `intro_${Date.now()}.jpg`);

    try {
      await downloadFile(imageUrl, filePath);

      await api.sendMessage(
        { attachment: fs.createReadStream(filePath) },
        threadID
      );
    } catch {
      await api.sendMessage("Failed to send the intro image.", threadID);
    } finally {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {}
    }
  },
};
