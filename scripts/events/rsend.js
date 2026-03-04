module.exports = {
	config: {
		name: "resend",
		version: "5.5",
		author: "Sadman Anik",
		countDown: 1,
		role: 2,
		shortDescription: {
			en: "Enable/Disable Anti unsend mode"
		},
		longDescription: {
			en: "Anti unsend mode. works with audio video and images"
		},
		category: "Admins",
		guide: {
			en: "{pn} mam/man\nex: {pn} mam"
		}
	},

	onStart: async function ({ api, message, event, threadsData, args }) {
		if (!["mam", "man"].includes(args[0]))
			return message.reply("দয়া করে সঠিক অপশন দিন: mam (অন) অথবা man (অফ)");

		const isEnable = args[0] === "mam";
		await threadsData.set(event.threadID, isEnable, "settings.reSend");

		if (isEnable) {
			if (!global.reSend) global.reSend = {};
			if (!global.reSend[event.threadID]) global.reSend[event.threadID] = [];
			
			const history = await api.getThreadHistory(event.threadID, 50);
			global.reSend[event.threadID] = history;
		}

		return message.reply(`Anti-Unsend ${isEnable ? "চালু হয়েছে (Hello)" : "বন্ধ হয়েছে (Sup)"}`);
	},

	onChat: async function ({ api, threadsData, usersData, event, message }) {
		if (!global.reSend) global.reSend = {};
		if (!global.reSend[event.threadID]) global.reSend[event.threadID] = [];

		const resendStatus = await threadsData.get(event.threadID, "settings.reSend");

		if (event.type === "message_unsend") {
			if (!resendStatus) return;

			const msgData = global.reSend[event.threadID].find(item => item.messageID === event.messageID);
			if (!msgData) return;

			const userData = await usersData.get(msgData.senderID);
			const name = userData ? userData.name : "ইউজার";

			if (msgData.body) {
				return message.send(`${name} এই মেসেজটি আনসেন্ড করেছে:\n\n"${msgData.body}"`);
			}
		} else {
			if (!resendStatus) return;
			
			global.reSend[event.threadID].push(event);

			if (global.reSend[event.threadID].length > 50) {
				global.reSend[event.threadID].shift();
			}
		}
	}
};
