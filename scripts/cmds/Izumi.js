const axios = require("axios");

module.exports = {
  config: {
    name: "izumi",
    version: "11.5.0",
    author: "SaAd",
    countDown: 0,
    role: 0,
    category: "system",
    description: "Multi-Command Redirector AI",
    usePrefix: false
  },

  onStart: async function () { },

  onChat: async function ({ api, event, usersData, threadsData }) {
    const { threadID, messageID, body, messageReply, senderID } = event;
    if (!body || senderID == api.getCurrentUserID()) return;

    const input = body.toLowerCase();
    const botName = "izumi"; 

    if (input.startsWith(botName)) {
      const query = body.slice(botName.length).trim();
      if (!query) return api.sendMessage("bolo ami sunchi! 🎀", threadID, messageID);

      const allCmds = Array.from(global.client.commands.keys());
      const words = query.toLowerCase().split(/\s+/);
      const commandName = words.find(word => allCmds.includes(word));

      if (commandName && commandName !== "izumi") {
        const command = global.client.commands.get(commandName);
        const filteredArgs = query.split(/\s+/).filter(w => w.toLowerCase() !== commandName);
        
        try {
          return command.onStart({ 
            api, 
            event, 
            args: filteredArgs, 
            usersData, 
            threadsData,
            message: {
                reply: (msg) => api.sendMessage(msg, threadID, messageID),
                send: (msg) => api.sendMessage(msg, threadID),
                react: (emoji) => api.setMessageReaction(emoji, messageID, () => {}, true)
            }
          });
        } catch (e) {
          console.error(e);
        }
      }

      if (input.includes("draw") || input.includes("image") || input.includes("imagine")) {
        try {
          const imgUrl = `https://pollinations.ai/p/${encodeURIComponent(query)}?width=1024&height=1024&model=flux`;
          const stream = (await axios.get(imgUrl, { responseType: 'stream' })).data;
          return api.sendMessage({ body: "Here is your image! ✨", attachment: stream }, threadID, messageID);
        } catch (e) { 
            return api.sendMessage("⚠️ Image generation failed.", threadID, messageID);
        }
      }

      try {
        const res = await axios.get(`https://api.sandipbaruwal.com.np/gpt4?prompt=${encodeURIComponent(query + " . (Answer in Bengali language)")}`);
        return api.sendMessage(res.data.answer, threadID, messageID);
      } catch (err) {
        return api.sendMessage("I'm sorry, bujhtesi na 😵‍💫", threadID, messageID);
      }
    }

    if (messageReply && messageReply.senderID == api.getCurrentUserID()) {
      try {
        const res = await axios.get(`https://api.sandipbaruwal.com.np/gpt4?prompt=${encodeURIComponent(body + " . (Answer in Bengali language)")}`);
        return api.sendMessage(res.data.answer, threadID, messageID);
      } catch (e) { return; }
    }
  }
};
