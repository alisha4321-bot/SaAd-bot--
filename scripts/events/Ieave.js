const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "leave",
		version: "1.9",
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

					if (leftParticipantFbId == author) {
						msgBody = `কি মজা ${userName} এই নালায়েক লিভ নিছে 🐸👋`;
						videoUrl = "https://i.imgur.com/A8YI7Ql.mp4"; 
					} else {
						const authorName = await usersData.getName(author) || "Admin";
						msgBody = `${userName} জা শালা আবাল 🙄🦵🏻`;
						videoUrl = "https://i.imgur.com/DMx7VW2.mp4"; 
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
							console.error("Failed to send message with attachment:", sendError);
						}

						setTimeout(() => {
							if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
						}, 10000);
					});

					writer.on('error', (err) => {
						console.error("Stream Writer Error:", err);
					});

				} catch (err) {
					console.error("Leave/Kick Event Error:", err);
					message.send(`Someone left the group, but there was an error loading the video.`);
				}
			};
		}
	}
};
