const fs = require("fs-extra");

module.exports = {
  config: {
    name: "alisha",
    version: "15.0.0",
    author: "SaAd",
    countDown: 0,
    role: 0,
    category: "system",
    description: "Command Redirector - Run other commands via conversation"
  },

  onStart: async function ({ api, event }) { },

  onChat: async function ({ api, event, args, usersData, threadsData }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    const input = body.toLowerCase();
    const botName = "alisha"; // আপনার দেওয়া নাম

    if (input.startsWith(botName)) {
      const query = body.slice(botName.length).trim();
      if (!query) return;

      // বটের সব কমান্ড এবং অ্যালিয়াস (Aliases) এর লিস্ট নেওয়া
      const allCmds = Array.from(global.GoatBot.commands.keys());
      const allAliases = Array.from(global.GoatBot.aliases.keys());
      const combinedCmds = [...allCmds, ...allAliases];
      
      const words = query.toLowerCase().split(" ");
      
      // আপনার কথার ভেতর কোনো কমান্ড বা অ্যালিয়াস আছে কি না দেখা
      const commandNameRaw = words.find(word => combinedCmds.includes(word));

      if (commandNameRaw) {
        // আসল কমান্ডের নাম খুঁজে বের করা (যদি অ্যালিয়াস হয়)
        const commandName = global.GoatBot.commands.has(commandNameRaw) 
                           ? commandNameRaw 
                           : global.GoatBot.aliases.get(commandNameRaw);
                           
        const command = global.GoatBot.commands.get(commandName);
        
        // কমান্ড বাদে বাকি শব্দগুলো args হিসেবে পাঠানো
        const filteredArgs = query.split(" ").filter(w => w.toLowerCase() !== commandNameRaw);
        
        try {
          return command.onStart({ 
            api, 
            event, 
            args: filteredArgs, 
            usersData, 
            threadsData,
            message: {
              reply: (text) => api.sendMessage(text, threadID, messageID),
              send: (text) => api.sendMessage(text, threadID)
            }
          });
        } catch (e) {
          console.error("Redirect Error:", e);
        }
      }
    }
  }
};
