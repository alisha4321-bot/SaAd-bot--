const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];
const leven = require('leven');

function getType(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

function getRole(threadData, senderID) {
    const config = global.GoatBot.config;
    const creator = config.creator || [];
    const developer = config.developer || [];
    const adminBot = config.adminBot || [];
    const premium = config.premium || [];
    const vipuser = config.vipuser || [];
    
    if (!senderID) return 0;
    const adminBox = threadData ? threadData.adminIDs || [] : [];
    
    if (creator.includes(senderID)) return 6;
    if (developer.includes(senderID)) return 5;
    if (adminBot.includes(senderID)) return 4;
    if (premium.includes(senderID)) return 3;
    if (vipuser.includes(senderID)) return 2;
    if (adminBox.includes(senderID)) return 1;
    return 0;
}

function getText(type, reason, time, targetID, lang) {
    const utils = global.utils;
    if (type == "userBanned")
        return utils.getText({ lang, head: "handlerEvents" }, "userBanned", reason, time, targetID);
    else if (type == "threadBanned")
        return utils.getText({ lang, head: "handlerEvents" }, "threadBanned", reason, time, targetID);
    else if (type == "onlyAdminBox")
        return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBox");
    else if (type == "onlyAdminBot")
        return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot");
    else if (type == "onlyVipUser")
        return utils.getText({ lang, head: "handlerEvents" }, "onlyVipUser");
    else if (type == "onlyDeveloper")
        return utils.getText({ lang, head: "handlerEvents" }, "onlyDeveloper");
    else if (type == "onlyCreator")
        return utils.getText({ lang, head: "handlerEvents" }, "onlyCreator");
}

function replaceShortcutInLang(text, prefix, commandName) {
    return text.replace(/\{(?:p|prefix)\}/g, prefix).replace(/\{(?:n|name)\}/g, commandName).replace(/\{pn\}/g, `${prefix}${commandName}`);
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
    let roleConfig;
    if (utils.isNumber(command.config.role)) {
        roleConfig = { onStart: command.config.role };
    } else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
        if (!command.config.role.onStart) command.config.role.onStart = 0;
        roleConfig = command.config.role;
    } else {
        roleConfig = { onStart: 0 };
    }
    if (isGroup) roleConfig.onStart = threadData.data.setRole?.[commandName] ?? roleConfig.onStart;
    for (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
        if (roleConfig[key] == undefined) roleConfig[key] = roleConfig.onStart;
    }
    return roleConfig;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
    const config = global.GoatBot.config;
    const { adminBot, developer, creator, hideNotiMessage } = config;
    const role = getRole(threadData, senderID);

    if (userData.banned.status == true) {
        if (hideNotiMessage.userBanned == false) message.reply(getText("userBanned", userData.banned.reason, userData.banned.date, senderID, lang));
        return true;
    }
    if (config.adminOnly.enable == true && !adminBot.includes(senderID) && !developer.includes(senderID) && !creator.includes(senderID) && !config.adminOnly.ignoreCommand.includes(commandName)) {
        if (hideNotiMessage.adminOnly == false) message.reply(global.utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot"));
        return true;
    }
    if (isGroup == true) {
        if (threadData.data.onlyAdminBox === true && !threadData.adminIDs.includes(senderID) && !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)) {
            if (!threadData.data.hideNotiMessageOnlyAdminBox) message.reply(getText("onlyAdminBox", null, null, null, lang));
            return true;
        }
        if (threadData.banned.status == true) {
            if (hideNotiMessage.threadBanned == false) message.reply(getText("threadBanned", threadData.banned.reason, threadData.banned.date, threadID, lang));
            return true;
        }
    }
    return false;
}

function createGetText2(langCode, pathCustomLang, prefix, command) {
    const commandName = command.config.name;
    let customLang = fs.existsSync(pathCustomLang) ? require(pathCustomLang)[commandName]?.text || {} : {};
    return function (key, ...args) {
        let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
        lang = replaceShortcutInLang(lang, prefix, commandName);
        for (let i = args.length - 1; i >= 0; i--) lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
        return lang || `❌ Can't find text key "${key}"`;
    };
}

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
    return async function (event, message) {
        const { utils, client, GoatBot } = global;
        const { getPrefix, removeHomeDir, log, getTime } = utils;
        const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
        const { body, messageID, threadID, isGroup } = event;

        if (!threadID) return;
        const senderID = event.userID || event.senderID || event.author;
        let threadData = global.db.allThreadData.find(t => t.threadID == threadID) || await threadsData.create(threadID);
        let userData = global.db.allUserData.find(u => u.userID == senderID) || await usersData.create(senderID);

        const prefix = getPrefix(threadID);
        const role = getRole(threadData, senderID);
        const isAdmin = role >= 4;

        const parameters = {
            api, usersData, threadsData, message, event, userModel, threadModel, prefix, dashBoardModel, globalModel, dashBoardData, globalData, envCommands, envEvents, envGlobal, role, isAdmin,
            removeCommandNameFromBody: function (b, p, c) { return b.replace(new RegExp(`^${p}(\\s+|)${c}`, "i"), "").trim(); },
            mentions: event.mentions || {}
        };
        const langCode = threadData.data.lang || config.language || "en";

        function createMessageSyntaxError(commandName) {
            message.SyntaxError = async function () { return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandSyntaxError", prefix, commandName)); };
        }

        /*
            +-----------------------------------------------+
            |           WHEN CALL COMMAND                   |
            +-----------------------------------------------+
        */
        async function onStart() {
            if (!body) return;
            let commandName = '';
            let args = [];
            
            if (body.startsWith(prefix)) {
                args = body.slice(prefix.length).trim().split(/ +/);
                commandName = args.shift().toLowerCase();
            } else if (isAdmin) {
                const words = body.trim().split(/ +/);
                const potentialCommand = words[0].toLowerCase();
                if (GoatBot.commands.has(potentialCommand) || GoatBot.aliases.has(potentialCommand)) {
                    commandName = potentialCommand;
                    args = words.slice(1);
                } else return;
            } else return;

            let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));
            if (command) commandName = command.config.name;

            if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
            if (!command) return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound", commandName, prefix));

            const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
            if (roleConfig.onStart > role) return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdmin", commandName));

            try {
                const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
                await command.onStart({ ...parameters, args, commandName, getLang: getText2 });
                log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID}`);
            } catch (err) { log.err("CALL COMMAND", commandName, err); }
        }

        /*
            +------------------------------------------------+
            |                    ON CHAT                     |
            +------------------------------------------------+
        */
        async function onChat() {
            const allOnChat = GoatBot.onChat || [];
            for (const key of allOnChat) {
                const command = GoatBot.commands.get(key);
                if (!command) continue;
                const roleConfig = getRoleConfig(utils, command, isGroup, threadData, command.config.name);
                if (roleConfig.onChat > role) continue;
                command.onChat({ ...parameters, args: body ? body.split(/ +/) : [], commandName: command.config.name, getLang: createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command) }).catch(err => log.err("onChat", command.config.name, err));
            }
        }

        /*
            +------------------------------------------------+
            |                   ON ANY EVENT                 |
            +------------------------------------------------+
        */
        async function onAnyEvent() {
            const allOnAnyEvent = GoatBot.onAnyEvent || [];
            for (const key of allOnAnyEvent) {
                const command = GoatBot.commands.get(key);
                if (!command) continue;
                command.onAnyEvent({ ...parameters, commandName: command.config.name, getLang: createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command) }).catch(err => log.err("onAnyEvent", command.config.name, err));
            }
        }

        /*
            +------------------------------------------------+
            |                  ON FIRST CHAT                 |
            +------------------------------------------------+
        */
        async function onFirstChat() {
            const allOnFirstChat = GoatBot.onFirstChat || [];
            for (const item of allOnFirstChat) {
                if (item.threadIDsChattedFirstTime.includes(threadID)) continue;
                const command = GoatBot.commands.get(item.commandName);
                if (!command) continue;
                item.threadIDsChattedFirstTime.push(threadID);
                command.onFirstChat({ ...parameters, commandName: command.config.name, getLang: createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command) }).catch(err => log.err("onFirstChat", command.config.name, err));
            }
        }

        /*
            +------------------------------------------------+
            |                    ON REPLY                    |
            +------------------------------------------------+
        */
        async function onReply() {
            if (!event.messageReply) return;
            const { onReply } = GoatBot;
            const Reply = onReply.get(event.messageReply.messageID);
            if (!Reply) return;
            const command = GoatBot.commands.get(Reply.commandName);
            if (!command) return;
            const roleConfig = getRoleConfig(utils, command, isGroup, threadData, command.config.name);
            if (roleConfig.onReply > role) return;
            try {
                await command.onReply({ ...parameters, Reply, args: body ? body.split(/ +/) : [], commandName: command.config.name, getLang: createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command) });
            } catch (err) { log.err("onReply", command.config.name, err); }
        }

        /*
            +------------------------------------------------+
            |                   ON REACTION                  |
            +------------------------------------------------+
        */
        async function onReaction() {
            const { onReaction } = GoatBot;
            const Reaction = onReaction.get(messageID);
            if (!Reaction) return;
            const command = GoatBot.commands.get(Reaction.commandName);
            if (!command) return;
            const roleConfig = getRoleConfig(utils, command, isGroup, threadData, command.config.name);
            if (roleConfig.onReaction > role) return;
            try {
                await command.onReaction({ ...parameters, Reaction, args: [], commandName: command.config.name, getLang: createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command) });
            } catch (err) { log.err("onReaction", command.config.name, err); }
        }

        /*
            +------------------------------------------------+
            |                 EVENT COMMAND                  |
            +------------------------------------------------+
        */
        async function handlerEvent() {
            for (const [key, getEvent] of GoatBot.eventCommands) {
                getEvent.onStart({ ...parameters, commandName: getEvent.config.name, getLang: createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, getEvent) }).catch(err => log.err("EVENT COMMAND", getEvent.config.name, err));
            }
        }

        /*
            +------------------------------------------------+
            |                    ON EVENT                    |
            +------------------------------------------------+
        */
        async function onEvent() {
            const allOnEvent = GoatBot.onEvent || [];
            for (const key of allOnEvent) {
                const command = GoatBot.commands.get(key);
                if (!command) continue;
                command.onEvent({ ...parameters, commandName: command.config.name, getLang: createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command) }).catch(err => log.err("onEvent", command.config.name, err));
            }
        }

         /*
         +------------------------------------------------+
         |                    PRESENCE                    |
         +------------------------------------------------+
        */
        async function presence() {
            // Your code here
        }

        /*
         +------------------------------------------------+
         |                  READ RECEIPT                  |
         +------------------------------------------------+
        */
        async function read_receipt() {
            // Your code here
        }

        /*
         +------------------------------------------------+
         |                      TYP                       |
         +------------------------------------------------+
        */
        async function typ() {
            // Your code here
        }

        return { onAnyEvent, onFirstChat, onChat, onStart, onReaction, onReply, onEvent, handlerEvent, presence, read_receipt, typ };
    };
};
