.event install leave.js const { getTime, drive } = global.utils;
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "leave",
		version: "1.4",
		author: "NTKhang/SaAd",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			leaveType1: "tự rời",
			leaveType2: "bị kick",
			defaultLeaveMessage: "{userName} đã {type} khỏi nhóm"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			leaveType1: "left",
			leaveType2: "was kicked from",
			defaultLeaveMessage: "{userName} {type} the group"
		}
	},

	onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
		if (event.logMessageType == "log:unsubscribe")
			return async function () {
				const { threadID } = event;
				const threadData = await threadsData.get(threadID);
				if (!threadData.settings.sendLeaveMessage)
					return;
				const { leftParticipantFbId } = event.logMessageData;
				if (leftParticipantFbId == api.getCurrentUserID())
					return;
				const userName = await usersData.getName(leftParticipantFbId);

				const isSelfLeave = leftParticipantFbId == event.author;
				const videoUrl = isSelfLeave ? "https://files.catbox.moe/enjbh3.mp4" : "https://files.catbox.moe/iscfll.mp4";
				const customBody = isSelfLeave ? `কি মজা এই নালায়েক লিভ নিছে 🐸😁 👉🏻 ${userName} ` : `${userName} জাহ শালা আবলামি করস কেনো kick খা 🙄🦵🏻`;

				const form = { body: customBody };

				try {
					const cacheDir = path.join(__dirname, "cache");
					if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
					const videoPath = path.join(cacheDir, `leave_${Date.now()}.mp4`);
					const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
					fs.writeFileSync(videoPath, Buffer.from(response.data));
					form.attachment = fs.createReadStream(videoPath);
					
					await message.send(form);
					
					setTimeout(() => { if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath); }, 10000);
					return; 
				} catch (e) {
					message.send(form);
				}
			};
	}
};
