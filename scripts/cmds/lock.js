const fs = require("fs-extra");
const path = path.join(__dirname, "cache", "lockedThreads.json");

// ডাটাবেস ফাইল চেক এবং লোড করার লজিক
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
let lockedThreads = JSON.parse(fs.readFileSync(path));

const pageID = "61588425573168"; 

module.exports = {
  config: {
    name: "lock",
    version: "3.5",
    author: "MOHAMMAD AKASH / SaAd",
    countDown: 5,
    role: 1,
    description: "Lock/unlock group to prevent members from sending messages",
    category: "box chat"
  },

  onStart: async function({ api, event, args }) {
    const threadID = event.threadID;
    const senderID = event.senderID;

    const info = await api.getThreadInfo(threadID);
    const adminIDs = info.adminIDs.map(i => i.id);

    if (!adminIDs.includes(senderID)) {
      return api.sendMessage("❌ Only group admins can use this command!", threadID);
    }

    const action = args[0]?.toLowerCase();

    // 🔒 LOCK
    if (action === "on" || action === "lock") {
      if (lockedThreads[threadID]) 
        return api.sendMessage("✅ This group is already locked!", threadID);

      try {
        await api.addUserToGroup(pageID, threadID);
      } catch (e) {}

      lockedThreads[threadID] = true;
      fs.writeFileSync(path, JSON.stringify(lockedThreads));
      return api.sendMessage("🔒 Group has been locked! Only admins can send messages now.", threadID);
    }

    // 🔓 UNLOCK
    if (action === "off" || action === "unlock") {
      if (!lockedThreads[threadID])
        return api.sendMessage("✅ This group is already unlocked!", threadID);

      delete lockedThreads[threadID];
      fs.writeFileSync(path, JSON.stringify(lockedThreads));

      try {
        await api.removeUserFromGroup(pageID, threadID);
      } catch (e) {}

      return api.sendMessage("🔓 Group has been unlocked! Everyone can send messages now.", threadID);
    }

    return api.sendMessage("❌ Usage: /lock on or /lock off", threadID);
  },

  onEvent: async function({ api, event }) {
    const { threadID, senderID, messageID, type } = event;

    if (!lockedThreads[threadID] || type !== "message") return;

    const info = await api.getThreadInfo(threadID);
    const adminIDs = info.adminIDs.map(i => i.id);

    // If not admin, unsend message
    if (!adminIDs.includes(senderID)) {
      try {
        await api.unsendMessage(messageID);
      } catch (e) {
        console.error("Failed to unsend message:", e);
      }
    }
  }
};
