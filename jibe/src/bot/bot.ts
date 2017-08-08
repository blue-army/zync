import * as botbuilder from 'botbuilder';
import * as teams from 'botbuilder-teams'
import * as conversation from '../bot/conversation';
import * as models from '../models/models'
import * as adaptiveCards from 'microsoft-adaptivecards'
import * as o365Dialog from './dialogs/o365card'
import * as botInfoDialogs from './dialogs/bot_info'
import * as utils from './bot-utils'
var currentSettingsCard = require('./cards/current_settings');
var currentSettings = require('./messages/current_settings');
var changeSettings = require('./cards/change_settings');
var events = require('./events/drillplan').events;
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
// Configure middleware for extracting channelId
bot.use({
    botbuilder: function (session, next) {
        saveChannelId(session);
        extractText(session);
        next();
    }
})

// Add middleware to send typing when we receive a message
bot.use(botbuilder.Middleware.sendTyping())

// In msteams, messages to jibe are prefixed with 'jibe'
// This function extracts the real message text. 
// Removing the jibe prefix is necessary for using the botbuilder built-in prompts.
function extractText(session: botbuilder.Session) {
    if (session.message.address.channelId === "emulator") {
        session.message.text = "jibe " + session.message.text;
    }
    var re = /Jibe(.*)/i;       // TODO: allow for text before and after 'jibe'
    var processed = re.exec(session.message.text);
    if (processed !== null) {
        session.message.text = processed[1].trim();     // remove extra spaces before/after the input
        // session.send("Processed input text: %s", session.message.text);
    }
}

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
bot.dialog('help', function () {}).triggerAction({
   matches: /help|commands/i,
   // (override the default behavior of replacing the stack)
   onSelectAction: function(session) {
       // Send a markdown-formatted bulleted list of commands
       let bullets = [
           "Here are some Jibe commands you can try: ",     // this is the header - will not be bulleted
           "Type 'settings' to view and edit your event subscriptions",
           "Type 'channel' to see your channel's ID",
           "Type 'address' to see your address",
           "Type 'payload' to see the body of your most recent message",
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
bot.dialog("quit", function(session){
   session.endConversation('Okay, goodbye!');
}).triggerAction({
   matches: /quit|exit|(good)?bye/i,
   confirmPrompt: "Are you sure you want to quit?"
});

// *** SEND USER ADDRESS ***
bot.dialog(botInfoDialogs.addressDialog.name, function () {}).triggerAction({
   matches: /address/i,
    // (override the default behavior of replacing the stack)
    onSelectAction: botInfoDialogs.addressDialog.dialog
});

// *** SEND CHANNEL ID ***
bot.dialog('channelId', function () {}).triggerAction({
   matches: /channel ?(id)?/i,
   // (override the default behavior of replacing the stack)
   onSelectAction: function(session) {
      let msg = "Your channel's ID is: " + session.conversationData.channelId;
      session.send(msg)
   }
});

// *** SEND MESSAGE PAYLOAD ***
bot.dialog(botInfoDialogs.payloadDialog.name, function () {}).triggerAction({
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
   matches: /(all )?users/i,
});


// *** SEND AN ADAPTIVECARD ***
bot.dialog('adaptiveCard', async function (session) {
    session.send("Sending an adaptiveCard!");
    let card = await settingsAC(session);
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
        session.send("Your channel's current settings are ... ");
        var settings = await settingsCard(session);
        // TODO: check settings were retrieved successfully
        session.send(settings);
        botbuilder.Prompts.confirm(session, "Do you want to update your settings?");
    },
    function (session, results) {
        if (results.response) {
            // TODO: send dropdown w/ available projects
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
        // Give user a list of project to choose from
        var projects = Object.keys(session.conversationData.subscriptions);
        botbuilder.Prompts.choice(session, 'Which project should we update?', projects);
    },
    // extract project info and start dialog to change settings
    async function (session, results) {
        var projectName = results.response.entity;
        var projectId = await conversation.getProjectId(projectName);       // match the project name to its ID
        let projectInfo = {id: projectId, name: projectName};
        session.beginDialog('changeSettingsViaList', {"project": projectInfo});
    },
    // Display current settings, prompt user to pick another project
    async function (session) {
        session.send("These are your current settings:");
        var settings = await settingsCard(session);
        session.send(settings);
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

        // Tell the user which subscriptions they already have
        var subs = await conversation.getSubscriptions(session.conversationData.channelId);
        if (subs[args.project.name].length > 0) {
            session.send("This channel is subscribed to the following %s events: %s", 
                         args.project.name,
                         subs[args.project.name].join(', '));
        } else {
            session.send("This channel is not subscribed to any events yet.");
        }

        // Send the list of events that they can subscribe to
        var eventNames = events.map((event: any) => {
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
                    session.send("You are now subscribed to %s events", results.response.entity);
                    botbuilder.Prompts.confirm(session, "Subscribe to more events?");
                })
                .catch(() => {
                    session.endDialog("Sorry, we were not able to update your subscriptions. Please try again later.")
                });
        }
    }, 
    function (session, results) {
        // Restart the dialog if they want to subscribe to more events
        if (results.response) {
            session.replaceDialog('changeSettingsViaList', {project: session.dialogData.project});
        } else {
            session.endDialog();
        }
    }
]);

// Prompts user to change their notification settings
bot.dialog('changeSettingsViaCard', [
    function (session) {
        if (session.message && session.message.value) {
            session.send(JSON.stringify(session.message.value));
             // TODO: update settings
            session.endDialog('Your settings have been updated.');
        } else if (session.message.text && session.message.text.search(/cancel/i) >= 0) {
            session.endDialog('Changes canceled');
        } else {
            session.send("Update your settings or type 'cancel' if you don't want to make changes");
        }
    }
]);


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
                    .map((m: botbuilder.IIdentity) => {return m.name;})
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


// *** RENDER CARDS ***
// async function selectEventsCard(projectName: string) {
//     // Get the projectId that corresponds to projectName
//     let projects = await jibe.getProjectList();
//     let proj = projects.find((p) => {
//         return p.name === projectName;
//     });

//     if (proj) {
//         // TODO: populate card with existing subscriptions
//         return changeSettings.createCard(projectName, proj.id);
//     }
// }

// Send the user their subscriptions
async function settingsCard(session: botbuilder.Session) {
    let subs = await conversation.getSubscriptions(session.conversationData.channelId);
    session.conversationData.subscriptions = subs;      // store subscription info
    let card = currentSettings.createMessage(subs);
    return card;
}

async function settingsAC(session: botbuilder.Session) {
    let subs = await conversation.getSubscriptions(session.conversationData.channelId);
    session.conversationData.subscriptions = subs;
    return currentSettingsCard.createCard(subs);
}

// Send a card to the given address
function sendEvent(address: botbuilder.IAddress, message: models.MessageInfo) {
    // Send regular message to verify the address
    bot.beginDialog(address, 'sendEvent', {message: message});
    // let botMsg = new botbuilder.Message()
    //     .address(address)
    //     .text("Sending a card to address %s", JSON.stringify(address))
    //     .addAttachment(createThumbnailCard(message))
    //     .addAttachment(createThumbnailCard(message))
    //     .attachmentLayout("list")
    //     .textFormat("markdown");
    // bot.send(botMsg);
}

function sendMessage(address: botbuilder.IAddress, message: string) {
    bot.send(new botbuilder.Message()
        .text(message)
        .address(address)
    );
}

bot.dialog('sendEvent', [
    function (session, args) {
        let msg = new botbuilder.Message()
            .text("Sending a card to address %s", JSON.stringify(session.message.address))
            // .addAttachment(createThumbnailCard(args.message))
            // .addAttachment(createThumbnailCard(args.message))
            .attachmentLayout("carousel")       // can be carousel or list
            .textFormat("markdown")

        let cards = createCards(args.message);
        cards.forEach((card) => {
            msg.addAttachment(card);
        });
        
        session.send(msg);
        sendActionableCard(session.message.address, o365.card);
        session.endDialog();
    }
]);

// Send ActionableCard (O365 Connector Card)
function sendActionableCard(address: botbuilder.IAddress, card: any) {
    bot.send(new botbuilder.Message()
        .address(address)
        .addAttachment({
                content: card,
                contentType: 'application/vnd.microsoft.teams.card.o365connector'
        })
    );
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

function createThumbnailCard(message: models.MessageInfo) {
    return new botbuilder.ThumbnailCard()
        .title(message.entityName)
        .subtitle(' - ' + message.subtitle1)
        .text("*" + message.subtitle2 + "*")
        .images([
            new botbuilder.CardImage().url(message.typeImageUrl)
        ])
        .buttons([
            botbuilder.CardAction.openUrl(null, message.actionUrl, 'Launch Applilcation')
        ]);
}

function createCards(message: models.MessageInfo) {
    let cards = [
        new botbuilder.ThumbnailCard()
            .title(message.entityName)
            .subtitle(' - ' + message.subtitle1)
            .text("*" + message.subtitle2 + "*")
            .images([
                new botbuilder.CardImage().url(message.typeImageUrl)
            ])
            .buttons([
                botbuilder.CardAction.openUrl(null, message.actionUrl, 'Launch Applilcation')
            ]),
        new botbuilder.ThumbnailCard()
            .title(message.entityName)
            .subtitle(' - ' + message.subtitle1)
            .text("*" + message.subtitle2 + "*")
            .images([
                new botbuilder.CardImage().url(message.typeImageUrl)
            ])
            .buttons([
                botbuilder.CardAction.openUrl(null, message.actionUrl, 'Launch Applilcation')
            ])
    ];
    return cards;

}

export {
    connector as connector,
    bot as bot,
    sendEvent as sendEvent,
    sendActionableCard as sendActionableCard,
    sendMessage as sendMessage
};
