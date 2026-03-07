const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "leave",
		version: "2.1",
		author: "NTKhang / SaAd",
		category: "events"
	},

	onStart: async ({ threadsData, message, event, api, usersData }) => {
		if (event.logMessageType == "log:unsubscribe") {
			return async function () {
				const { threadID } = event;
				const threadData = await threadsData.get(threadID);

				if (threadData.settings.sendLeaveMessage == false) return;

				const { leftParticipantFbId, author } = event.logMessageData;
				
				if (leftParticipantFbId == api.getCurrentUserID()) return;

				try {
					const userName = await usersData.getName(leftParticipantFbId) || "User";
					let msgBody = "";
					let videoUrl = "";

					// উন্নত চেক: String এ কনভার্ট করে তুলনা করা (যাতে আইডি ম্যাচিং এ ভুল না হয়)
					if (String(leftParticipantFbId) === String(author)) {
						// ১. এটি লিভ (Self Left)
						msgBody = `কি মজা ${userName} এই নালায়েক লিভ নিছে 🐸👋`;
						videoUrl = "https://files.catbox.moe/enjbh3.mp4"; 
					} else {
						// ২. এটি কিক (Kicked Out)
						msgBody = `${userName} জা শালা আবাল 🙄🦵🏻`;
						videoUrl = "https://files.catbox.moe/iscfll.mp4"; 
					}

					const cacheDir = path.join(__dirname, "cache");
					if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
					const videoPath = path.join(cacheDir, `leave_${Date.now()}.mp4`);

					const response = await axios({
						method: 'get',
						url: videoUrl,
						responseType: 'stream'
					});

					const writer = fs.createWriteStream(videoPath);
					response.data.pipe(writer);

					writer.on('finish', async () => {
						try {
							await message.send({
								body: msgBody,
								attachment: fs.createReadStream(videoPath)
							});
						} catch (sendError) {
							console.error("Failed to send message:", sendError);
						}

						// পাঠানোর ১০ সেকেন্ড পর ডিলিট
						setTimeout(() => {
							if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
						}, 10000);
					});

				} catch (err) {
					console.error("Leave/Kick Error:", err);
					message.send(`Notification: User left or was kicked out.`);
				}
			};
		}
	}
};
						
