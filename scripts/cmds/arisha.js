const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/alisha4321-bot/saad-s-raw/refs/heads/main/baseApiUrl.json");
  return base.data.saad;
};

module.exports = {
  config: {
    name: "arisha",
    version: "7.0",
    author: "SaAd",
    countDown: 3,
    role: 0,
    category: "ai",
    guide: {
      en: "Type 'Gemini' and talk naturally",
    },
  },

  onChat: async function ({ api, event }) {
    if (!event.body) return;
    const msg = event.body.toLowerCase();
    if (msg === "arisha" || msg.startsWith("arisha ")) {
      const args = event.body.split(/\s+/);
      args.shift(); 
      return this.onStart({ api, args, event });
    }
  },

  onStart: async function ({ api, args, event }) {
    try {
      const apiUrl = `${await baseApiUrl()}/api/gemini`;
      const userQuery = args.join(" ").trim().toLowerCase();
      
      
      const coreInstruction = `Act as a sweet, natural human girl. 
1. Reply ONLY in Banglish. 
2. Keep replies VERY SHORT (max 1 sentence). 
3. DO NOT mention you are an AI, Gemini, or made by SaAd unless someone explicitly asks 'Who are you?' or 'Who is your owner?'. 
4. Behave like a normal friend. No long robotic explanations.`;

      let finalPrompt = "";
      if (!userQuery) {
        finalPrompt = `${coreInstruction}\nSomeone called your name. Say something short and sweet in Banglish like 'Bolo shunsi' or 'Ki bolba bolo'.`;
      } else {
        finalPrompt = `${coreInstruction}\nUser says: ${userQuery}`;
      }

      let requestBody = { prompt: finalPrompt };

      if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
        const attachment = event.messageReply.attachments[0];
        if (attachment.type === "photo") {
          requestBody.imageUrl = attachment.url;
        }
      }

      const response = await axios.post(apiUrl, requestBody, {
        headers: { 
          "Content-Type": "application/json",
          "author": "SaAd"
        }
      });

      const replyText = response.data.response || "Hmm, bolo...";

      api.sendMessage({ body: replyText }, event.threadID, (error, info) => {
        if (!error) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
          });
        }
      }, event.messageID);

    } catch (error) {
      api.sendMessage("Ektu problem hocche bby, pore bolo.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (Reply.author !== event.senderID) return;

    try {
      const apiUrl = `${await baseApiUrl()}/api/gemini`;
      const coreInstruction = `Reply in Banglish. Keep it VERY SHORT. Talk like a normal human girl. Mention SaAd as owner ONLY if asked.`;

      const response = await axios.post(apiUrl, { 
        prompt: `${coreInstruction}\nUser: ${event.body}` 
      }, {
        headers: { 
          "Content-Type": "application/json",
          "author": "saad"
        }
      });

      const replyText = response.data.response || "Hmm...";

      api.sendMessage({ body: replyText }, event.threadID, (error, info) => {
        if (!error) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
          });
        }
      }, event.messageID);
    } catch (error) {
      api.sendMessage("Error hoyeche...", event.threadID, event.messageID);
    }
  }
};
