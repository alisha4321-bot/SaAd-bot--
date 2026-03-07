const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "rsend",
        version: "1.0",
        author: "NTKhang/SaAd",
        category: "events"
    },

    onStart: async () => {
        if (!global.logMessage) global.logMessage = new Map();
    },

    onEvent: async ({ event, api, usersData }) => {
        if (!global.logMessage) global.logMessage = new Map();

        // মেসেজ লগিং (টেক্সট এবং অ্যাটাচমেন্ট)
        if (event.type === "message" || event.type === "message_reply") {
            global.logMessage.set(event.messageID, {
                body: event.body || "",
                attachments: event.attachments || [],
                senderID: event.senderID
            });
        }

        // আনসেন্ড ইভেন্ট ডিটেকশন
        if (event.type === "message_unsend") {
            const savedMsg = global.logMessage.get(event.messageID);
            if (!savedMsg || savedMsg.senderID == api.getCurrentUserID()) return;

            const name = await usersData.getName(savedMsg.senderID) || "Someone";
            let msgBody = `${name}, nigga 🐸 delete a message 👉🏻\n\n${savedMsg.body ? savedMsg.body : "কিছুই লেখে নাই!"}`;

            const form = { body: msgBody };
            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

            const attachments = [];
            if (savedMsg.attachments && savedMsg.attachments.length > 0) {
                for (const att of savedMsg.attachments) {
                    try {
                        const ext = att.type === "photo" ? "jpg" : "mp4";
                        const filePath = path.join(cacheDir, `${Date.now()}_${att.ID}.${ext}`);
                        const response = await axios.get(att.url, { responseType: "arraybuffer" });
                        fs.writeFileSync(filePath, Buffer.from(response.data));
                        attachments.push(fs.createReadStream(filePath));
                    } catch (e) { continue; }
                }
            }

            form.attachment = attachments;
            await api.sendMessage(form, event.threadID);

            // ফাইল ক্লিনআপ
            setTimeout(() => {
                attachments.forEach(stream => {
                    if (fs.existsSync(stream.path)) fs.unlinkSync(stream.path);
                });
            }, 10000);

            global.logMessage.delete(event.messageID);
        }
    }
};
                  
