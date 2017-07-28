var builder = require('botbuilder');
import * as conversation from '../bot/conversation';
import * as jibe from '../service/jibe';
// var currentSettings = require('./cards/current_settings');
var currentSettings = require('./messages/current_settings');
var changeSettings = require('./cards/change_settings');
var events = require('./events/drillplan').events;


// *** SETUP ***
// Create bot connector
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID || "",
    appPassword: process.env.MICROSOFT_APP_PASSWORD || "" 
});

// Create bot
var bot = new builder.UniversalBot(connector)


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
function extractText(session) {
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
function saveChannelId(session) {
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
bot.dialog('help', function (session, args, next) {}).triggerAction({
   matches: /^help$/i,
   // (override the default behavior of replacing the stack)
   onSelectAction: function(session, args, next) {
      session.send("I'm a bot that plays tic tac toe!");
      session.send("Please type ‘quit’ or ‘restart’ if you don’t want to keep playing.");
      session.send("To play, click on an open tile or type in its row and column (like A1 or C2).<br/>Some platforms, like Slack, will only allow text input.");
   }
});


// *** SEND USER ADDRESS ***
bot.dialog('address', function (session, args, next) {}).triggerAction({
   matches: /address/i,
   // (override the default behavior of replacing the stack)
   onSelectAction: function(session, args, next) {
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
        builder.Prompts.confirm(session, "Do you want to update your settings?");
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
        builder.Prompts.choice(session, 'Which project should we update?', projects, builder.ListStyle.button);
    },
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
    async function (session, results) {
        session.send("These are your current settings:");
        var settings = await settingsCard(session);
        session.send(settings);
        builder.Prompts.confirm(session, "Would you like to update settings for another project?");
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
        var eventNames = events.map((event) => {
            return event.name;
        });
        eventNames.push("None");
        builder.Prompts.choice(session, "Which event would you like to subscribe to?", eventNames, builder.ListStyle.button);
    },
    async function (session, results) {
        // Subscribe the channel to the selected event
        if (results.response.entity === "None") {
            session.send("No events selected.")
        } else {
            await conversation.addNotifications(session.dialogData.project.id, 
                                                session.conversationData.channelId, 
                                                JSON.stringify(session.message.address),
                                                [results.response.entity]);
            // TODO: error handling if update fails
            session.send("You are now subscribed to %s events", results.response.entity);
        }
        builder.Prompts.confirm(session, "Subscribe to more events?");
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

    // Emulator testing
    if (message.address.channelId === "emulator") {
        // Channel and team are the same because we are registering the 'general' channel
        channel = extractId("19:ee6cdd412a40495aabfa2427cbf17897@thread.skype");
        team = extractId("19:ee6cdd412a40495aabfa2427cbf17897@thread.skype");

        bot.send(new builder.Message()
            .address(message.address)
            .text("Team: %s | Channel: %s", team, channel));
    }

    // Extract team and channel info if the message was sent from MS Teams
    else if (message.address.channelId === "msteams") {

        // TODO: check if this is a group chat before channel extraction
        var channel = extractId(message.address.conversation.id);

        // This team ID is the ID of the project's 'general' channel
        var team = extractId(message.sourceEvent.team.id);

        bot.send(new builder.Message()
            .address(message.address)
            .text("Team: %s | Channel: %s", team, channel));
    }

    // Display the sourceEvent
    if (message.sourceEvent) {
        bot.send(new builder.Message()
            .address(message.address)
            .text("message.sourceEvent: " + JSON.stringify(message.sourceEvent)));
    }

    if (message.membersAdded && message.membersAdded.length > 0) {

        // check if the bot is in the list of new channel members
        var botIndex = message.membersAdded.findIndex(function (element) {
            return element.id === message.address.bot.id;
        });

        // If the bot was just added to the channel, send an introduction message
        if (botIndex >= 0) {
            // Send introduction message
            bot.send(new builder.Message()
                .address(message.address)
                .text("Hello everyone! I'm Jibe."));
        }

        // Otherwise, welcome the new channel members
        else {
            bot.send(new builder.Message()
                .address(message.address)
                .text('Welcome ' + message.membersAdded
                    .map((m) => {return m.name;})
                    .join(', ') + "!"));
        }
    }

    if (message.membersRemoved && message.membersRemoved.length > 0) {
        var membersRemoved = message.membersRemoved
            .map(function (m) {
                var isSelf = m.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
            })
            .join(', ');

        bot.send(new builder.Message()
            .address(message.address)
            .text('The following members ' + membersRemoved + ' were removed or left the conversation :('));
    }
});

bot.on('event', function (message) {
    bot.send(new builder.Message()
        .address(message.address)
        .text("Event: " + JSON.stringify(message)));
});

bot.on('contactRelationUpdate', function (message) {
    bot.send(new builder.Message()
        .address(message.address)
        .text("contactRelationUpdate: " + JSON.stringify(message)));
});


// *** RENDER CARDS ***
async function selectEventsCard(address, projectName) {
    // Get the projectId that corresponds to projectName
    let projects = await jibe.getProjectList();
    let proj = projects.find((p) => {
        return p.name === projectName;
    });

    if (proj) {
        // TODO: populate card with existing subscriptions
        return changeSettings.createCard(projectName, proj.id);
    }
}

// Send the user their subscriptions
async function settingsCard(session) {
    let subs = await conversation.getSubscriptions(session.conversationData.channelId);
    session.conversationData.subscriptions = subs;      // store subscription info
    let card = currentSettings.createMessage(subs);
    return card;
}

// Send a card to the given address
function sendCard(address, message) {
    bot.send(new builder.Message()
        .address(address)
        .text("Sending a card to address %s", JSON.stringify(address))
    );
    if (address.channelId === "msteams") {
        bot.send(new builder.Message()
            .address(address)
            .addAttachment(message)
        );
    }
}

export {
    connector as connector,
    sendCard as sendCard
};
