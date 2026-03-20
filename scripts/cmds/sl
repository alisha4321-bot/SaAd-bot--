const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "sl",
    version: "1.4",
    author: "𝙰𝙳𝙽𝙰𝙽",
    role: 2,
    shortDescription: "Toggle selfListen instantly",
    longDescription: "Enable or disable bot's ability to listen to its own messages without restart",
    category: "owner",
    guide: "{prefix}sl on | {prefix}sl off"
  },

  onStart: async function ({ args, message, event, api }) {
    // Authorized UID from your saved info
    const allowedUIDs = ["61550670293729"]; 

    if (!allowedUIDs.includes(event.senderID)) {
      return message.reply("❌ Permission Denied: You are not authorized to use this command.");
    }

    const input = args[0]?.toLowerCase();

    // Locating the config.json file
    const configPath = path.join(process.cwd(), "config.json");
    
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (err) {
      console.error(err);
      return message.reply("❌ Error: Unable to locate or load config.json file.");
    }

    // Getting the global prefix automatically
    const globalPrefix = config.prefix || "/";

    if (!input) {
      const status = config.optionsFca.selfListen ? "ON" : "OFF";
      return message.reply(`🤖 selfListen status: *${status}*\nUsage: ${globalPrefix}sl on | ${globalPrefix}sl off`);
    }

    if (!["on", "off"].includes(input)) {
      return message.reply(`❌ Invalid Input: Use '${globalPrefix}sl on' to enable or '${globalPrefix}sl off' to disable.`);
    }

    const newValue = input === "on";

    const attitudeReplies = {
      on: [
        "🔥 selfListen is now ON. Ready to process my own messages!",
        "😎 selfListen activated — monitoring my own output now.",
        "🚀 Self-listening mode enabled successfully."
      ],
      off: [
        "🛑 selfListen is now OFF. I will no longer respond to myself.",
        "😤 selfListen disabled — ignoring my own chatter now.",
        "🔕 selfListen deactivated. Peace out."
      ]
    };

    try {
      // Updating the configuration
      config.optionsFca.selfListen = newValue;
      
      // Saving the file
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      // Applying to the current session
      api.setOptions({ selfListen: newValue });

      const replies = attitudeReplies[input];
      const replyMsg = replies[Math.floor(Math.random() * replies.length)];

      message.reply(`✅ ${replyMsg}`);
      console.log(`[SL COMMAND] selfListen set to ${newValue} by ${event.senderID}`);
    } catch (err) {
      console.error("[SL COMMAND ERROR]", err);
      message.reply("❌ Error: Failed to update the configuration file.");
    }
  }
};
