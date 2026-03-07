const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "rsend",
		version: "2.0",
		author: "NTKhang / SaAd",
		category: "events"
	},

	onStart: async () => {
		if (!global.rsendLog) global.rsendLog = new Map();
	},

	onEvent: async ({ event, api, usersData }) => {

		if (!global.rsendLog) global.rsendLog = new Map();

		// Save message
		if (event.type === "message" || event.type === "message_reply") {
			global.rsendLog.set(event.messageID, {
				body: event.body || "",
				attachments: event.attachments || [],
				senderID: event.senderID
			});
		}

		// Detect unsend
		if (event.type === "message_unsend") {

			const data = global.rsendLog.get(event.messageID);
			if (!data || data.senderID == api.getCurrentUserID()) return;

			const name = await usersData.getName(data.senderID) || "Someone";

			let text = `${name} nigga 🐸 delete a message 👉🏻\n\n${data.body || "কিছুই লেখে নাই!"}`;

			const form = {
				body: text,
				mentions: [{
					tag: name,
					id: data.senderID
				}]
			};

			const cacheDir = path.join(__dirname, "cache");
			if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

			const files = [];

			if (data.attachments.length > 0) {
				for (const att of data.attachments) {
					try {

						let ext = "dat";
						if (att.type === "photo") ext = "jpg";
						else if (att.type === "video") ext = "mp4";
						else if (att.type === "audio") ext = "mp3";
						else if (att.type === "animated_image") ext = "gif";

						const file = path.join(cacheDir, `${Date.now()}_${att.ID}.${ext}`);

						const res = await axios.get(att.url, {
							responseType: "arraybuffer"
						});

						fs.writeFileSync(file, Buffer.from(res.data));
						files.push(fs.createReadStream(file));

					} catch (err) { }
				}
			}

			form.attachment = files;

			api.sendMessage(form, event.threadID);

			// auto delete cache
			setTimeout(() => {
				files.forEach(f => {
					if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
				});
			}, 15000);

			global.rsendLog.delete(event.messageID);
		}
	}
};
