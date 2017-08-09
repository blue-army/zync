import * as botbuilder from 'botbuilder';
import * as teams from 'botbuilder-teams'
import * as conversation from '../bot/conversation';
import * as adaptiveCards from 'microsoft-adaptivecards'
import * as utils from './bot-utils'
import * as jibe from '../service/jibe'
import * as settingsCards from './actionableCards/settings-cards'
import * as drillplan from '../plugins/drillplan'

// Import Dialogs
import * as o365Dialog from './dialogs/subscription-card-dialogs'
import * as botInfoDialogs from './dialogs/bot-info-dialogs'

var currentSettingsCard = require('./adaptiveCards/current_settings');
var o365 = require('../bot/o365message');


// *** SETUP ***
// Create bot connector
var connector = new teams.TeamsChatConnector({
    appId: process.env.MICROSOFT_APP_ID || "",
    appPassword: process.env.MICROSOFT_APP_PASSWORD || ""
});

// Create bot
var bot = new botbuilder.UniversalBot(connector)


// *** MIDDLEWARE ***

// Strip out mentions of bot's name in the input text
// E.g. "<at>jibe<\/at> command" -> "command"
// Removing this jibe mention is necessary for using the botbuilder built-in prompts.
var stripBotAtMentions = new teams.StripBotAtMentions();
bot.use(stripBotAtMentions);

// Configure middleware for extracting channelId
bot.use({
    botbuilder: function (session, next) {
        saveChannelId(session);
        next();
    }
})

// Add middleware to send typing when we receive a message
bot.use(botbuilder.Middleware.sendTyping())

// Middleware for storing each conversation's channelId 
function saveChannelId(session: botbuilder.Session) {
    // If we don't already have the channelId for this conversation, 
    // extract it and save it in conversationData
    if (!session.conversationData.channelId) {
        // extract the channelId from the conversationId in the address
        var chId = session.message.address.conversation.id;
        if (session.message.address.channelId === "msteams" && session.message.address.conversation.isGroup) {
            chId = utils.extractId(session.message.address.conversation.id);
        }
        else if (session.message.address.channelId === "emulator") {
            chId = "emulator";
        }
        session.conversationData.channelId = chId;
        // session.send("Saving your channelId: %s", session.conversationData.channelId);
    }
}

function getChannelAddress(session: botbuilder.Session) {
    // Extract and save the channel address
    // This preprocessing is only necessary for MS Teams addresses because they reference a thread within the channel
    if (!session.conversationData.channelAddress) {
        // perform deep copy of address
        session.conversationData.channelAddress = JSON.parse(JSON.stringify(session.message.address));

        // remove thread suffix from channelId
        session.conversationData.channelAddress.conversation.id = session.message.address.conversation.id.split(';')[0];

        // Remove user info (not needed for routing)
        delete session.conversationData.channelAddress.user;

        // delete 'id' entry (links to specific thread)
        // delete session.conversationData.channelAddress.id;
    }
    return session.conversationData.channelAddress;
}


// *** ROOT DIALOG ***
bot.dialog('/',
    function (session) {
        if (session.message.text) {
            session.send("Hi there, %s!  We didn't recognize the command '%s' - try another command or type 'help' to see what Jibe can do.",
                session.message.address.user.name.split(' ')[0],
                session.message.text
            );
        }
    });


// O365 Card Sample Dialog
bot.dialog('sendO365Card', o365Dialog.dialog)
    .triggerAction({
        matches: /O?365(card)?/i,
    });

// Handle card responses
connector.onO365ConnectorCardAction(o365Dialog.cardActionHandler);


// *** HELP DIALOG ***
bot.dialog('help', function () { }).triggerAction({
    matches: /help|commands/i,
    // (override the default behavior of replacing the stack)
    onSelectAction: function (session) {
        // Send a markdown-formatted bulleted list of commands
        let bullets = [
            "Here are some Jibe commands you can try: ",     // this is the header - will not be bulleted
            "Type 'settings' to view and edit your event subscriptions",
            "Type 'channel' to see your channel's ID",
            "Type 'address' to see your address",
            "Type 'payload' to see the body of your most recent message",
            "Type 'channel info' to see info on this channel",
            "Type 'team info' to see the list of channels in this team",
            "Type 'whoami' to see your own user info",
            "Type 'all users' to see all users on this team",
            "Type 'adaptiveCard' to send a test adaptiveCard",
            "Type 'o365card' to send a test event selection card",
            "Type 'actionableCard to send a test actionableCard",
            "Type 'quit' or 'goodbye' to end the conversation"
        ]
        let msg = bullets.join('\n * ');
        session.send(msg);
    }
});


// *** QUIT DIALOG ***
// This dialog ends the conversation.
// The user can trigger it at any time by typing 'quit'
// Issue - confirmation prompt is not sent
bot.dialog("quit", function (session) {
    session.endConversation('Okay, goodbye!');
}).triggerAction({
    matches: /(^| )(quit|exit|(good)?bye)( |$)/i,
    confirmPrompt: "Are you sure you want to quit?"
});

// *** SEND USER ADDRESS ***
bot.dialog(botInfoDialogs.addressDialog.name, function () { }).triggerAction({
    matches: /address/i,
    // (override the default behavior of replacing the stack)
    onSelectAction: botInfoDialogs.addressDialog.dialog
});

// *** SEND CHANNEL ID ***
bot.dialog('channelId', function () { }).triggerAction({
    matches: /channel ?(id)?/i,
    // (override the default behavior of replacing the stack)
    onSelectAction: function (session) {
        let msg = "Your channel's ID is: " + session.conversationData.channelId;
        session.send(msg)
    }
});

// *** SEND MESSAGE PAYLOAD ***
bot.dialog(botInfoDialogs.payloadDialog.name, function () { }).triggerAction({
    matches: /payload|body|request|message/i,
    // (override the default behavior of replacing the stack)
    onSelectAction: botInfoDialogs.payloadDialog.dialog
});

// *** SEND CURRENT CHANNEL INFO ***
bot.dialog(botInfoDialogs.channelInfoDialog.name, botInfoDialogs.channelInfoDialog.dialog)
    .triggerAction({
        matches: /channel( ?info)?/i,
    });

// *** SEND CURRENT TEAM INFO ***
bot.dialog(botInfoDialogs.teamInfoDialog.name, botInfoDialogs.teamInfoDialog.dialog)
    .triggerAction({
        matches: /team( ?info)?/i,
    });

// *** SEND CURRENT USER'S INFO ***
bot.dialog(botInfoDialogs.userInfoDialog.name, botInfoDialogs.userInfoDialog.dialog)
    .triggerAction({
        matches: /my ?info|whoami/i,
    });

// *** SEND ALL USERS' INFO ***
bot.dialog(botInfoDialogs.allUsersDialog.name, botInfoDialogs.allUsersDialog.dialog)
    .triggerAction({
        matches: /(all (the )?)?(users|members)/i,
    });


// *** SEND AN ADAPTIVECARD ***
// Send an adaptiveCard displaying current settings
// AdaptiveCards are not currently supported in teams, but supported by other channels
bot.dialog('adaptiveCard', async function (session) {
    let subs: conversation.Subscription[];
    try {
        subs = await conversation.getSubscriptions(session.conversationData.channelId);
    } catch (e) {
        session.endDialog("Sorry, we were unable to retrieve your subscriptions.");
        return;
    }
    session.send("Sending an adaptiveCard!");
    let card = currentSettingsCard.createCard(subs);
    sendAdaptiveCard(session.message.address, card);
    session.endDialog("Card sent!");
}).triggerAction({
    matches: /adaptive ?(card)?/i,
});


// *** SEND AN ACTIONABLECARD ***
bot.dialog('actionableCard', function (session) {
    session.send("Sending an actionableCard!");
    let card = o365.card;
    sendActionableCard(session.message.address, card);
    session.endDialog("Card sent!");
}).triggerAction({
    matches: /actionable ?(card)?/i,
});


// *** SEND A CARDACTION ***
bot.dialog('CardAction', function (session) {
    session.send("Sending a card action!");
    const buttons = [botbuilder.CardAction.postBack(session, 'apple', 'apple'),
    botbuilder.CardAction.postBack(session, 'orange', 'orange')]
    const attachment = new botbuilder.HeroCard(session)
        .title("message").buttons(buttons)
    session.send(new botbuilder.Message(session).addAttachment(attachment))
    session.endDialog("Card action sent!");
}).triggerAction({
    matches: /(card ?)?action/i,
});


// *** EVENT SUBSCRIPTION DIALOGS ***
bot.dialog('settings', [
    async function (session) {
        // Create card
        let card: teams.O365ConnectorCard;
        try {
            card = await settingsCards.viewSettingsCard(session);
        } catch (e) {
            session.endDialog("Sorry, we were unable to retrieve your settings. Please try again later.");
            return;
        }
        var msg = new teams.TeamsMessage(session)
            .summary("Settings card")
            .addAttachment(card);
        session.send(msg);
        botbuilder.Prompts.confirm(session, "Do you want to update your settings?");
    },
    function (session, results) {
        if (results.response) {
            // begin project selection process
            session.beginDialog('selectProject');
        } else {
            session.endDialog('Ok, settings have not been changed.');
        }
    }
]).triggerAction({
    // Trigger this dialog when the user types something related to settings/subscriptions
    matches: /settings|options|config|configure|subscribe|subscriptions|projects|events|notifications/i
});

// Prompts user to select a project to edit the settings for
bot.dialog('selectProject', [
    function (session) {
        // Give the user a list of projects to choose from
        jibe.getProjectList()
            .then((projects) => {
                let projectNames = projects.map((p) => p.name);
                botbuilder.Prompts.choice(session, 'Which project should we update?', projectNames, { listStyle: botbuilder.ListStyle.list });
            })
            .catch(() => {
                session.endDialog("Oops, there was a problem loading the project selection. Please try again later.")
            })
    },
    // extract project info and start dialog to change settings
    async function (session, results, next) {
        var projectName = results.response.entity;
        var projectId: string;
        try {
            // match the selected project's name to its ID
            projectId = await conversation.getProjectId(projectName);
            if (!projectId) {
                throw "Project ID not found";       // detect project ID retrieval issues
            }
        } catch (e) {
            session.send("Sorry, we could not find that project. Please try again later.");
            next();         // continue on to next step of waterfall
        }
        // pass project info to new dialog
        let projectInfo = { id: projectId, name: projectName };
        session.beginDialog('changeSettingsViaList', { "project": projectInfo });
    },
    // Display current settings, prompt user to pick another project
    async function (session) {
        // Create card
        let card: teams.O365ConnectorCard;
        try {
            card = await settingsCards.viewSettingsCard(session);
        } catch (e) {
            session.endDialog("Sorry, we were unable to retrieve your settings. Please try again later.");
            return;
        }
        var msg = new teams.TeamsMessage(session)
            .summary("Settings card")
            .text("These are your current settings:")
            .addAttachment(card);
        session.send(msg);
        botbuilder.Prompts.confirm(session, "Would you like to update settings for another project?");
    },
    function (session, results) {
        if (results.response) {
            session.replaceDialog('selectProject');
        } else {
            session.endDialog('Ok, goodbye!');
        }
    }
])


// Prompts user to subscribe to events from a list
bot.dialog('changeSettingsViaList', [
    async function (session, args) {
        session.dialogData.project = args.project;

        // Retrieve subscription info from the db
        var subs;
        try {
            subs = await conversation.getSubscriptions(session.conversationData.channelId);
        } catch (e) {
            session.endDialog("Sorry, we were unable to load your subscriptions. Please try again later.");
            return;
        }

        // Get subscription information for the single project the user is interested in
        let projectSubs = subs.find((s) => {
            return s.project === session.dialogData.project.name;
        });

        // Tell the user which events they are already subscribed to
        if (projectSubs.events.length > 0) {
            session.send("This channel is subscribed to the following %s events: %s",
                args.project.name,
                projectSubs.events.join(', '));
        } else {
            session.send("This channel is not subscribed to any events yet.");
        }

        // Send the list of events that they can subscribe to
        var eventNames = drillplan.events.map((event: any) => {
            return event.name;
        });
        eventNames.push("None");
        botbuilder.Prompts.choice(session, "Which event would you like to subscribe to?", eventNames);
    },
    async function (session, results) {
        // Subscribe the channel to the selected event
        if (results.response.entity === "None") {
            session.send("No events selected.")
            botbuilder.Prompts.confirm(session, "Subscribe to more events?");
        } else {
            // Update the relevant project in the database
            let addr = getChannelAddress(session);      // preprocess address
            conversation.addNotifications(session.dialogData.project.id, session.conversationData.channelId, JSON.stringify(addr), [results.response.entity])
                .then(() => {
                    let msg = "You are now subscribed to " + results.response.entity + " events. \n";
                    // TODO: Send a different message if they are already subscribed
                    botbuilder.Prompts.confirm(session, msg + "Subscribe to more events?");
                })
                .catch(() => {
                    session.endDialog("Sorry, we were not able to update your subscriptions. Please try again later.");
                });
        }
    },
    function (session, results) {
        // Restart the dialog if they want to subscribe to more events
        if (results.response) {
            session.replaceDialog('changeSettingsViaList', { project: session.dialogData.project });
        } else {
            session.endDialog();
        }
    }
]);

bot.dialog('sendSettingsCard', async function (session) {
    let card;
    try {
        card = await settingsCards.viewSettingsCard(session);
    } catch (e) {
        session.send("Sorry, we were unable to retrieve your settings. Please try again later.");
        return;
    }
    var msg = new teams.TeamsMessage(session)
        .summary("A sample O365 actionable card")
        .addAttachment(card);
    session.send(msg);
    session.endDialog();
}).triggerAction({
    matches: /settings ?card/i,
});


// *** HANDLE CONVERSATION UPDATES ***
// Triggered on conversationUpdate event, which is sent when:
// - a channel is created
// - a user is added to the conversation
// - the bot is added to the conversation
bot.on('conversationUpdate', function (message) {

    // Extract team and channel info if the message was sent from MS Teams
    if (message.address.channelId === "msteams") {

        // TODO: check if this is a group chat before channel extraction
        var channel = utils.extractId(message.address.conversation.id);

        // This team ID is the ID of the project's 'general' channel
        var team = utils.extractId(message.sourceEvent.team.id);

        bot.send(new botbuilder.Message()
            .address(message.address)
            .text("Team: %s <br/> Channel: %s", team, channel));
    }

    // Display the sourceEvent
    if (message.sourceEvent) {
        bot.send(new botbuilder.Message()
            .address(message.address)
            .text("message.sourceEvent: " + JSON.stringify(message.sourceEvent)));
    }

    if (message.membersAdded && message.membersAdded.length > 0) {

        // check if the bot is in the list of new channel members
        var botIndex = message.membersAdded.findIndex(function (element: botbuilder.IIdentity) {
            return element.id === message.address.bot.id;
        });

        // If the bot was just added to the channel, send an introduction message
        if (botIndex >= 0) {
            // Send introduction message
            bot.send(new botbuilder.Message()
                .address(message.address)
                .text("Hello everyone! I'm Jibe."));
        }

        // Otherwise, welcome the new channel members
        else {
            bot.send(new botbuilder.Message()
                .address(message.address)
                .text('Welcome ' + message.membersAdded
                    .map((m: botbuilder.IIdentity) => { return m.name; })
                    .join(', ') + "!"));
        }
    }

    // if (message.membersRemoved && message.membersRemoved.length > 0) {
    //     var membersRemoved = message.membersRemoved
    //         .map(function (m: botbuilder.IIdentity) {
    //             var isSelf = m.id === message.address.bot.id;
    //             return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
    //         })
    //         .join(', ');

    //     bot.send(new botbuilder.Message()
    //         .address(message.address)
    //         .text('The following members ' + membersRemoved + ' were removed or left the conversation :('));
    // }
});

// Send a message to the given address
function sendMessage(address: botbuilder.IAddress, message: string) {
    bot.send(new botbuilder.Message()
        .text(message)
        .address(address)
    );
}

// Send ActionableCard (O365 Connector Card)
function sendActionableCard(address: botbuilder.IAddress, card: any) {
    let msg = new botbuilder.Message()
        .address(address)
    if (card.toAttachment) {
        msg.addAttachment(card);
    } else {
        // Specify content type only if the card does not have a 'toAttachement' function for generating card JSON
        msg.addAttachment({
            content: card,
            contentType: 'application/vnd.microsoft.teams.card.o365connector'
        })
    }
    bot.send(msg);
}

// Send AdaptiveCard
// Not yet supported by teams, but is supported by other channels
function sendAdaptiveCard(address: botbuilder.IAddress, card: adaptiveCards.AdaptiveCard) {
    bot.send(new botbuilder.Message()
        .address(address)
        .addAttachment({
            content: card,
            contentType: "application/vnd.microsoft.card.adaptive"
        })
    );
}

export {
    connector as connector,
    bot as bot,
    sendActionableCard as sendActionableCard,
    sendMessage as sendMessage
};
