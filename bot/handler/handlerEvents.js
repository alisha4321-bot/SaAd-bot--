const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];
const leven = require('leven');

function getType(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

// <<< --- UPDATED: getRole FUNCTION WITH COMPLETE HIERARCHY --- >>>
function getRole(threadData, senderID) {
    const config = global.GoatBot.config;
    
    // Get all role lists from config
    const creator = config.creator || [];
    const developer = config.developer || [];
    const adminBot = config.adminBot || [];
    const premium = config.premium || [];
    const vipuser = config.vipuser || [];
    
    if (!senderID) return 0;
    
    const adminBox = threadData ? threadData.adminIDs || [] : [];
    
    if (creator.includes(senderID))
        return 6;
    
    if (developer.includes(senderID))
        return 5;
    
    if (adminBot.includes(senderID))
        return 4;
    
    if (premium.includes(senderID))
        return 3;
    
    if (vipuser.includes(senderID))
        return 2;
    
    if (adminBox.includes(senderID))
        return 1;
        
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
}

function replaceShortcutInLang(text, prefix, commandName) {
    return text
        .replace(/\{(?:p|prefix)\}/g, prefix)
        .replace(/\{(?:n|name)\}/g, commandName)
        .replace(/\{pn\}/g, `${prefix}${commandName}`);
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
    let roleConfig;
    if (utils.isNumber(command.config.role)) {
        roleConfig = {
            onStart: command.config.role
        };
    }
    else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
        if (!command.config.role.onStart)
            command.config.role.onStart = 0;
        roleConfig = command.config.role;
    }
    else {
        roleConfig = {
            onStart: 0
        };
    }

    if (isGroup)
        roleConfig.onStart = threadData.data.setRole?.[commandName] ?? roleConfig.onStart;

    for (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
        if (roleConfig[key] == undefined)
            roleConfig[key] = roleConfig.onStart;
    }

    return roleConfig;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
    const config = global.GoatBot.config;
    const { adminBot, hideNotiMessage } = config;

    const infoBannedUser = userData.banned;
    if (infoBannedUser.status == true) {
        const { reason, date } = infoBannedUser;
        if (hideNotiMessage.userBanned == false)
            message.reply(getText("userBanned", reason, date, senderID, lang));
        return true;
    }

    if (config.adminOnly.enable == true && !adminBot.includes(senderID) && !config.adminOnly.ignoreCommand.includes(commandName)) {
        if (hideNotiMessage.adminOnly == false)
            message.reply(getText("onlyAdminBot", null, null, null, lang));
        return true;
    }

    if (isGroup == true) {
        if (threadData.data.onlyAdminBox === true && !threadData.adminIDs.includes(senderID) && !adminBot.includes(senderID) && !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)) {
            if (!threadData.data.hideNotiMessageOnlyAdminBox)
                message.reply(getText("onlyAdminBox", null, null, null, lang));
            return true;
        }

        const infoBannedThread = threadData.banned;
        if (infoBannedThread.status == true) {
            const { reason, date } = infoBannedThread;
            if (hideNotiMessage.threadBanned == false)
                message.reply(getText("threadBanned", reason, date, threadID, lang));
            return true;
        }
    }
    return false;
}

function createGetText2(langCode, pathCustomLang, prefix, command) {
    const commandType = command.config.countDown ? "command" : "command event";
    const commandName = command.config.name;
    let customLang = {};
    let getText2 = () => { };
    if (fs.existsSync(pathCustomLang))
        customLang = require(pathCustomLang)[commandName]?.text || {};

    if (command.langs || customLang || {}) {
        getText2 = function (key, ...args) {
            let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
            lang = replaceShortcutInLang(lang, prefix, commandName);
            for (let i = args.length - 1; i >= 0; i--)
                lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
            return lang || `❌ Can't find text on language "${langCode}" for ${commandType} "${commandName}" with key "${key}"`;
        };
    }
    return getText2;
}

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
    return async function (event, message) {
        const { utils, client, GoatBot } = global;
        const { getPrefix, removeHomeDir, log, getTime } = utils;
        const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
        const { autoRefreshThreadInfoFirstTime } = config.database;
        let { hideNotiMessage = {} } = config;
        const { body, messageID, threadID, isGroup } = event;

        if (!threadID)
            return;

        const senderID = event.userID || event.senderID || event.author;
        let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
        if (!threadData)
            threadData = await threadsData.create(threadID);
        let userData = global.db.allUserData.find(u => u.userID == senderID);
        if (!userData)
            userData = await usersData.create(senderID);

        if (typeof threadData.settings.hideNotiMessage == "object")
            hideNotiMessage = threadData.settings.hideNotiMessage;

        const prefix = getPrefix(threadID);
        const role = getRole(threadData, senderID);
        const isAdmin = role >= 4;

        const parameters = {
            api,
            usersData,
            threadsData,
            message,
            event,
            userModel,
            threadModel,
            prefix,
            dashBoardModel,
            globalModel,
            dashBoardData,
            globalData,
            envCommands,
            envEvents,
            envGlobal,
            role,
            isAdmin,
            removeCommandNameFromBody: function (b, p, c) {
                return b.replace(new RegExp(`^${p}(\\s+|)${c}`, "i"), "").trim();
            }
        };

        const langCode = threadData.data.lang || config.language || "en";

        function createMessageSyntaxError(commandName) {
            message.SyntaxError = async function () {
                return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandSyntaxError", prefix, commandName));
            };
        }

        /*
         +-----------------------------------------------+
         |               WHEN CALL COMMAND               |
         +-----------------------------------------------+
        */
        async function onStart() {
            if (!body)
                return;

            let commandName = "";
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

            const dateNow = Date.now();
            let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));

            const aliasesData = threadData.data.aliases || {};
            for (const cmdName in aliasesData) {
                if (aliasesData[cmdName].includes(commandName)) {
                    command = GoatBot.commands.get(cmdName);
                    break;
                }
            }

            if (command)
                commandName = command.config.name;

            if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode))
                return;

            if (!command) {
                if (!hideNotiMessage.commandNotFound) {
                    if (commandName) {
                        const allCommandName = Array.from(GoatBot.commands.keys());
                        const checker = leven(commandName, allCommandName.reduce((a, b) => leven(commandName, a) < leven(commandName, b) ? a : b));
                        return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound", commandName, checker <= 3 ? utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFoundSuggestion", allCommandName.reduce((a, b) => leven(commandName, a) < leven(commandName, b) ? a : b)) : "", prefix));
                    }
                    else
                        return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandNotFound2", prefix));
                }
                else
                    return true;
            }

            const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
            if (roleConfig.onStart > role)
                return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdmin", commandName));

            if (!client.countDown[commandName])
                client.countDown[commandName] = {};

            const cooldownCommand = (command.config.countDown || 1) * 1000;
            if (client.countDown[commandName][senderID] && (dateNow < client.countDown[commandName][senderID] + cooldownCommand) && !isAdmin)
                return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "waitingForCommand", ((client.countDown[commandName][senderID] + cooldownCommand - dateNow) / 1000).toString().slice(0, 3)));

            try {
                const pathCustomLang = `${process.cwd()}/languages/cmds/${langCode}.js`;
                const getText2 = createGetText2(langCode, pathCustomLang, prefix, command);
                createMessageSyntaxError(commandName);
                await command.onStart({
                    ...parameters,
                    args,
                    commandName,
                    getLang: getText2
                });
                if (!isAdmin)
                    client.countDown[commandName][senderID] = dateNow;
                log.info("CALL COMMAND", `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(" ")}`);
            }
            catch (err) {
                log.err("CALL COMMAND", `An error occurred when calling the command onStart ${commandName}`, err);
            }
        }

        /*
         +------------------------------------------------+
         |                    ON CHAT                     |
         +------------------------------------------------+
        */
        async function onChat() {
            const allOnChat = GoatBot.onChat;
            for (const key of allOnChat) {
                const command = GoatBot.commands.get(key);
                const commandName = command.config.name;
                const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
                if (roleConfig.onChat > role)
                    continue;

                const pathCustomLang = `${process.cwd()}/languages/cmds/${langCode}.js`;
                const getText2 = createGetText2(langCode, pathCustomLang, prefix, command);
                createMessageSyntaxError(commandName);
                command.onChat({
                    ...parameters,
                    args: body ? body.split(/ +/) : [],
                    commandName,
                    getLang: getText2
                })
                    .catch(err => {
                        log.err("onChat", `An error occurred when calling the command onChat ${commandName}`, err);
                    });
            }
        }

        /*
         +------------------------------------------------+
         |                   ON ANY EVENT                 |
         +------------------------------------------------+
        */
        async function onAnyEvent() {
            const allOnAnyEvent = GoatBot.onAnyEvent;
            for (const key of allOnAnyEvent) {
                const command = GoatBot.commands.get(key);
                const commandName = command.config.name;

                const pathCustomLang = `${process.cwd()}/languages/events/${langCode}.js`;
                const getText2 = createGetText2(langCode, pathCustomLang, prefix, command);
                command.onAnyEvent({
                    ...parameters,
                    commandName,
                    getLang: getText2
                })
                    .catch(err => {
                        log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
                    });
            }
        }

        /*
         +------------------------------------------------+
         |                  ON FIRST CHAT                 |
         +------------------------------------------------+
        */
        async function onFirstChat() {
            const allOnFirstChat = GoatBot.onFirstChat;
            for (const item of allOnFirstChat) {
                const { commandName, threadIDsChattedFirstTime } = item;
                if (threadIDsChattedFirstTime.includes(threadID))
                    continue;

                const command = GoatBot.commands.get(commandName);
                threadIDsChattedFirstTime.push(threadID);

                const pathCustomLang = `${process.cwd()}/languages/cmds/${langCode}.js`;
                const getText2 = createGetText2(langCode, pathCustomLang, prefix, command);
                createMessageSyntaxError(commandName);
                command.onFirstChat({
                    ...parameters,
                    commandName,
                    getLang: getText2
                })
                    .catch(err => {
                        log.err("onFirstChat", `An error occurred when calling the command onFirstChat ${commandName}`, err);
                    });
            }
        }

        /*
         +------------------------------------------------+
         |                    ON REPLY                    |
         +------------------------------------------------+
        */
        async function onReply() {
            if (!event.messageReply)
                return;
            const { onReply } = GoatBot;
            const Reply = onReply.get(event.messageReply.messageID);
            if (!Reply)
                return;

            const commandName = Reply.commandName;
            const command = GoatBot.commands.get(commandName);
            if (!command)
                return;

            const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
            if (roleConfig.onReply > role)
                return;

            const pathCustomLang = `${process.cwd()}/languages/cmds/${langCode}.js`;
            const getText2 = createGetText2(langCode, pathCustomLang, prefix, command);
            createMessageSyntaxError(commandName);
            try {
                await command.onReply({
                    ...parameters,
                    Reply,
                    args: body ? body.split(/ +/) : [],
                    commandName,
                    getLang: getText2
                });
            }
            catch (err) {
                log.err("onReply", `An error occurred when calling the command onReply ${commandName}`, err);
            }
        }

        /*
         +------------------------------------------------+
         |                   ON REACTION                  |
         +------------------------------------------------+
        */
        async function onReaction() {
            const { onReaction } = GoatBot;
            const Reaction = onReaction.get(messageID);
            if (!Reaction)
                return;

            const commandName = Reaction.commandName;
            const command = GoatBot.commands.get(commandName);
            if (!command)
                return;

            const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
            if (roleConfig.onReaction > role)
                return;

            const pathCustomLang = `${process.cwd()}/languages/cmds/${langCode}.js`;
            const getText2 = createGetText2(langCode, pathCustomLang, prefix, command);
            createMessageSyntaxError(commandName);
            try {
                await command.onReaction({
                    ...parameters,
                    Reaction,
                    args: body ? body.split(/ +/) : [],
                    commandName,
                    getLang: getText2
                });
            }
            catch (err) {
                log.err("onReaction", `An error occurred when calling the command onReaction ${commandName}`, err);
            }
        }

        /*
         +------------------------------------------------+
         |                 EVENT COMMAND                  |
         +------------------------------------------------+
        */
        async function handlerEvent() {
            const allEventCommand = GoatBot.eventCommands.entries();
            for (const [key, value] of allEventCommand) {
                const getEvent = GoatBot.eventCommands.get(key);
                const commandName = getEvent.config.name;

                const pathCustomLang = `${process.cwd()}/languages/events/${langCode}.js`;
                const getText2 = createGetText2(langCode, pathCustomLang, prefix, getEvent);
                try {
                    await getEvent.onStart({
                        ...parameters,
                        commandName,
                        getLang: getText2
                    });
                }
                catch (err) {
                    log.err("EVENT COMMAND", `An error occurred when calling the command handlerEvent ${commandName}`, err);
                }
            }
        }

        /*
         +------------------------------------------------+
         |                    ON EVENT                    |
         +------------------------------------------------+
        */
        async function onEvent() {
            const allOnEvent = GoatBot.onEvent;
            for (const key of allOnEvent) {
                const command = GoatBot.commands.get(key);
                const commandName = command.config.name;
                const pathCustomLang = `${process.cwd()}/languages/events/${langCode}.js`;
                const getText2 = createGetText2(langCode, pathCustomLang, prefix, command);
                command.onEvent({
                    ...parameters,
                    commandName,
                    getLang: getText2
                })
                    .then(async (response) => {
                        if (response === "resetThreadInfo") {
                            try {
                                await threadsData.refreshInfo(threadID);
                                if (autoRefreshThreadInfoFirstTime === true) {
                                    log.info("REFRESH INFO", `Refreshed thread info for thread ID ${threadID}`);
                                }
                            }
                            catch (err) {
                                log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
                            }
                        }
                    })
                    .catch(err => {
                        log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
                    });
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

        return {
            onAnyEvent,
            onFirstChat,
            onChat,
            onStart,
            onReaction,
            onReply,
            onEvent,
            handlerEvent,
            presence,
            read_receipt,
            typ
        };
    };
};
