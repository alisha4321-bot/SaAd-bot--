const { getTime } = global.utils;

module.exports = {
  config: {
    name: "autoinvite",
    version: "2.5",
    author: "Mohammad Akash",
    category: "events"
  },

  onStart: async ({ api, event, usersData, message, threadsData }) => {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID, logMessageData, author } = event;
    const leftID = logMessageData.leftParticipantFbId;

    // নতুন ফিচার: ON/OFF চেক
    const threadData = await threadsData.get(threadID);
    if (threadData.settings?.autoinvite === false) return;

    if (leftID === author) {
      const userName = await usersData.getName(leftID);

      const boldMap = {
        A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜", J: "𝗝",
        K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧",
        U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭",
        a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶", j: "𝗷",
        k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿", s: "𝘀", t: "𝘁",
        u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇"
      };

      const boldName = userName.split("").map(c => boldMap[c] || c).join("");

      const form = {
        body: `🛑 এই বলদ....!! 😹  
${boldName}  
💬 গ্রুপ থেকে লিভ নেওয়া কি মুখের কথা নাকি? 😏  
👑 যে গ্রুপে আমি থাকি..?? 🐸  
⚠️ সেই গ্রুপ থেকে লিভ নেওয়া অসম্ভব ভাই! 😂  
🌀 নে বলদ আবার অ্যাড করে দিলাম 😇  

━━━━━━━━━━━━━━━
🤖 𝗕𝗼𝘁 𝗢𝘄𝗻𝗲𝗿 : 𝗦𝗔𝗔𝗗 𝗩𝗔𝗶 👽
━━━━━━━━━━━━━━━`
      };

      try {
        await api.addUserToGroup(leftID, threadID);
        await message.send(form);
      } catch (err) {
        message.send("⚠️ দুঃখিত, আমি ইউজারটাকে আবার অ্যাড করতে পারিনি। সম্ভবত অ্যাড ব্লক করা আছে।");
      }
    }
  }
};
