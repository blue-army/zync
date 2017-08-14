import * as botbuilder from 'botbuilder'
import * as teams from 'botbuilder-teams'
import * as conversation from '../bot/conversation'
import * as models from '../models/models'
import * as adaptiveCards from 'microsoft-adaptivecards'
import * as utils from './bot-utils'
import * as jibe from '../service/jibe'
import * as settingsCards from './actionableCards/settings-cards'
import * as drillplan from '../plugins/drillplan'
import * as subscriptionDialogs from './dialogs/subscription-dialogs'
import * as slackCards from './slack-messages'

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
var bot = new botbuilder.UniversalBot(connector);

// Register event subscription dialogs
bot.library(subscriptionDialogs.createLibrary());

// Register bot info dialogs
bot.library(botInfoDialogs.lib);


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
            "Type 'event selection card' to send a test event selection card",
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


// O365 Card Sample Dialog
bot.dialog('sendO365Card', o365Dialog.dialog)
    .triggerAction({
        matches: /event ?(selection)? ?card/i,
    });

// Handle card responses
connector.onO365ConnectorCardAction(o365Dialog.cardActionHandler);


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

// Send a slack message to the given address
function sendSlackMessage(address: botbuilder.IAddress, card: any) {
    bot.send(new botbuilder.Message()
        .address(address)
        .sourceEvent({
            "slack": card
        })
    );
}

// Send a card/message based on the given message info
// Card type depends on the address' chat client
function sendJibeEvent(address: botbuilder.IAddress, messageInfo: models.MessageInfo) {
    // If sending to Microsoft Teams, send an Actionable Card
    if (address.channelId === 'msteams') {
        let card = drillplan.createO365MessageCard(messageInfo);
        sendActionableCard(address, card);
    }
    else if (address.channelId === 'slack') {
        let card = slackCards.jibeEvent(messageInfo);
        sendSlackMessage(address, card);
    }
    else {
        bot.send(new botbuilder.Message()
            .address(address)
            .text("Incoming Jibe Event!")
        );
    }
}

export {
    connector,
    bot,
    sendActionableCard,
    sendAdaptiveCard,
    sendMessage,
    sendJibeEvent
};
