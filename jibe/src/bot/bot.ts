import * as botbuilder from 'botbuilder';
import * as teams from 'botbuilder-teams'
import * as conversation from '../bot/conversation';
import * as models from '../models/models'
// var currentSettings = require('./cards/current_settings');
var currentSettings = require('./messages/current_settings');
var changeSettings = require('./cards/change_settings');
var events = require('./events/drillplan').events;
var o365 = require('../bot/o365message');


// *** SETUP ***
// Create bot connector
var connector = new botbuilder.ChatConnector({
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

// In msteams, messages to jibe are prefixed with 'jibe'
// This function extracts the real message text. 
// Removing the jibe prefix is necessary for using the botbuilder built-in prompts.
function extractText(session: botbuilder.Session) {
    if (session.message.address.channelId === "emulator") {
        session.message.text = "jibe " + session.message.text;
    }
    var re = /Jibe(.*)/i;
    var processed = re.exec(session.message.text);
    if (processed !== null) {
        session.message.text = processed[1].trim();     // remove extra spaces before/after the input
        session.send("Processed input text: %s", session.message.text);
    }
}

// Extract the real channelId from the ID returned by teams
function extractId(teamsId: string) {
    var re = /^\d\d:(\S+)@thread\.skype/;
    var results = re.exec(teamsId);
    if (results && results.length > 0) {
        return results[1];          // return extracted ID
    }
    console.log("Could not extract an ID from ", teamsId);
}

// Middleware for storing each conversation's channelId 
function saveChannelId(session: botbuilder.Session) {
    // If we don't already have the channelId for this conversation, 
    // extract it and save it in conversationData
    if (!session.conversationData.channelId) {
        // extract the channelId from the conversationId in the address
        if (session.message.address.channelId === "msteams") {
            var chId = extractId(session.message.address.conversation.id);
            session.send("channelId extracted: %s", chId);
        }
        else if (session.message.address.channelId === "emulator") {
            var chId = "emulator";
        }
        session.conversationData.channelId = chId;
        session.send("Saving your channelId: %s", session.conversationData.channelId);
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
        
        // delete 'id' entry (links to specific thread)
        // delete session.conversationData.channelAddress.id;
    }
    return session.conversationData.channelAddress;
}


// *** ROOT DIALOG ***
// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
bot.dialog('/', 
    function (session) {
        if (session.message.text) {
            session.send("Hi there, %s", session.message.address.user.name.split(' ')[0]);
            session.send("You said: %s", session.message.text);
        }
});


// *** HELP DIALOG ***
bot.dialog('help', function () {}).triggerAction({
   matches: /^help$/i,
   // (override the default behavior of replacing the stack)
   onSelectAction: function(session) {
      session.send("I'm a bot that plays tic tac toe!");
      session.send("Please type ‘quit’ or ‘restart’ if you don’t want to keep playing.");
      session.send("To play, click on an open tile or type in its row and column (like A1 or C2).<br/>Some platforms, like Slack, will only allow text input.");
   }
});


// *** SEND USER ADDRESS ***
bot.dialog('address', function () {}).triggerAction({
   matches: /address/i,
   // (override the default behavior of replacing the stack)
   onSelectAction: function(session) {
      session.send("Your address is: \n" + JSON.stringify(session.message.address, null, "   "));
   }
});


// *** EVENT SUBSCRIPTION DIALOGS ***
bot.dialog('settings', [
    async function (session) {
        session.send("Your channel's current settings are ... ");
        var settings = await settingsCard(session);
        // TODO: check settings were retrieved successfully
        session.send(settings);
        session.send(new botbuilder.Message().addAttachment(createThumbnailCard(session)));
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
        var projectId = await conversation.getProjectId(projectName);
        session.send("projectID: %s", projectId);
        // var card = changeSettings.createCard(projectName, projectId);
        // if (card) {
        //     session.send(new builder.Message().addAttachment(card));
        // }
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

        // Send card (doesn't work with teams)
        let card = changeSettings.createCard(args.project.name, args.project.id)
        session.send(new botbuilder.Message().addAttachment(card));

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
        } else {
            let addr = getChannelAddress(session);
            await conversation.addNotifications(session.dialogData.project.id, 
                                                session.conversationData.channelId, 
                                                JSON.stringify(addr),     // preprocess address to remove messageid
                                                [results.response.entity]);
            // TODO: error handling if update fails
            session.send("You are now subscribed to %s events", results.response.entity);
        }
        botbuilder.Prompts.confirm(session, "Subscribe to more events?");
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
        var channel = extractId(message.address.conversation.id);

        // This team ID is the ID of the project's 'general' channel
        var team = extractId(message.sourceEvent.team.id);

        bot.send(new botbuilder.Message()
            .address(message.address)
            .text("Team: %s | Channel: %s", team, channel));
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

    if (message.membersRemoved && message.membersRemoved.length > 0) {
        var membersRemoved = message.membersRemoved
            .map(function (m: botbuilder.IIdentity) {
                var isSelf = m.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
            })
            .join(', ');

        bot.send(new botbuilder.Message()
            .address(message.address)
            .text('The following members ' + membersRemoved + ' were removed or left the conversation :('));
    }
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

// Send ActionableCard
function sendActionableCard(address: botbuilder.IAddress, card: any) {
    bot.send(new botbuilder.Message()
        .address(address)
        .addAttachment({
                content: card,
                contentType: 'application/vnd.microsoft.teams.card.o365connector'
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
    sendEvent as sendEvent
};
