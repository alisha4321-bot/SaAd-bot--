const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "tiktok",
    aliases: ["tt", "tik"],
    version: "2.5",
    author: "নাই",
    countDown: 10,
    role: 0,
    shortDescription: "Search and download TikTok videos",
    longDescription: "Search for TikTok videos. Use '/tiktok <query>' for auto-best video or '/tiktok s <query>' to select from a list.",
    category: "media",
    guide: "{pn} <query> - Auto send first video\n{pn} s <query> - Show list to select"
  },

  onStart: async function ({ api, event, args, message }) {
    if (args.length === 0) {
      return message.reply("⚠️ Please provide a search query.\nExample: /tiktok anime edits");
    }

    const isSearchMode = args[0].toLowerCase() === "s";
    const query = isSearchMode ? args.slice(1).join(" ") : args.join(" ");

    if (!query) {
      return message.reply("⚠️ Please provide a query after 's'.\nExample: /tiktok s funny cat");
    }

    try {
      const apiUrl = `https://short-video-api-by-arafat.vercel.app/arafat?keyword=${encodeURIComponent(query)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || data.length === 0) {
        return message.reply("❌ No results found on TikTok.");
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      // --- Mode 1: Search List (Select manually with 6 Pictures) ---
      if (isSearchMode) {
        const topVideos = data.slice(0, 6);
        let msgBody = `📱 **TikTok Search Results**\nQuery: "${query}"\n\n`;

        topVideos.forEach((video, index) => {
          msgBody += `${index + 1}. **${video.title.substring(0, 30)}...**\n`;
          msgBody += `   👤 ${video.author.nickname} | ⏱️ ${video.duration}s\n\n`;
        });

        msgBody += `👉 Reply with 1-6 to download.`;

        const coverPaths = [];
        const attachmentStreams = [];

        for (let i = 0; i < topVideos.length; i++) {
          const coverPath = path.join(cacheDir, `tt_cover_${event.senderID}_${i}_${Date.now()}.jpg`);
          try {
            const response = await axios.get(topVideos[i].cover, { responseType: "arraybuffer" });
            fs.writeFileSync(coverPath, Buffer.from(response.data));
            coverPaths.push(coverPath);
            attachmentStreams.push(fs.createReadStream(coverPath));
          } catch (err) {
            console.error(`Failed to download cover ${i}`, err);
          }
        }

        return message.reply({
            body: msgBody,
            attachment: attachmentStreams
        }, (err, info) => {
          // Cleanup covers after sending
          coverPaths.forEach(p => { try { fs.unlinkSync(p); } catch (e) {} });

          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            results: topVideos
          });
        });
      }

      // --- Mode 2: Auto Send (First Result) ---
      const firstVideo = data[0];
      await this.downloadAndSend(api, message, firstVideo);

    } catch (error) {
      console.error("TikTok Error:", error);
      message.reply("❌ An error occurred while fetching data.");
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { author, results } = Reply;
    if (event.senderID !== author) return;

    const choice = parseInt(event.body);
    if (isNaN(choice) || choice < 1 || choice > results.length) {
      return message.reply(`⚠️ Invalid choice. Please reply with 1-${results.length}.`);
    }

    const selectedVideo = results[choice - 1];
    api.unsendMessage(Reply.messageID);
    
    const downloadingMsg = await message.reply(`⬇️ Downloading video, please wait...`);
    await this.downloadAndSend(api, message, selectedVideo, downloadingMsg.messageID);
  },

  // সংশোধিত হেল্পার ফাংশন যা মডিউলের ভেতরেই রাখা হয়েছে
  downloadAndSend: async function (api, message, video, loadingMsgID) {
    const cacheDir = path.join(__dirname, "cache");
    const cachePath = path.join(cacheDir, `tiktok_${Date.now()}.mp4`);
    
    try {
      await fs.ensureDir(cacheDir);
      const response = await axios({
        method: "GET",
        url: video.videoUrl,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      if (loadingMsgID) api.unsendMessage(loadingMsgID);

      await message.reply({
        body: `✅ ${video.title}`,
        attachment: fs.createReadStream(cachePath)
      });

    } catch (error) {
      console.error("TikTok Download Error:", error);
      if (loadingMsgID) api.unsendMessage(loadingMsgID);
      message.reply("❌ Failed to download the video.");
    } finally {
      // ৫ সেকেন্ড পর ফাইল ডিলিট করা
      setTimeout(() => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, 5000);
    }
  }
};
      
