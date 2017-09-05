import * as botbuilder from 'botbuilder'
import * as teams from 'botbuilder-teams'
import * as adaptiveCards from 'microsoft-adaptivecards/built/schema'
import * as conversation from '../bot/conversation'
import * as models from '../models/models'
// import * as drillplan from '../plugins/drillplan'

// Import channel-specific functionality
import * as slack from '../chat/slack'
import * as msteams from '../chat/msteams'

// Import Dialogs
import * as o365Dialog from './dialogs/subscription-card-dialogs'
import * as botInfoDialogs from './dialogs/bot-info-dialogs'
import * as subscriptionDialogs from './dialogs/subscription-dialogs'
import * as express from 'express';

// *** SETUP ***
// Create bot connector
var connector = new teams.TeamsChatConnector({
    appId: process.env.MICROSOFT_APP_ID || "",
    appPassword: process.env.MICROSOFT_APP_PASSWORD || ""
});

function init(app: express.Application) {
    app.post('/api/bot/messages', connector.listen());
}

// Create bot
var bot = new botbuilder.UniversalBot(connector);

// Register event subscription dialogs
bot.library(subscriptionDialogs.createLibrary());

// Register bot info dialogs
bot.library(botInfoDialogs.createLibrary(connector));


// *** MIDDLEWARE ***
// Strip out mentions of bot's name in the input text
// E.g. "<at>jibe<\/at> command" -> "command"
// Removing this jibe mention is necessary for using the botbuilder built-in prompts.
var stripBotAtMentions = new teams.StripBotAtMentions();
bot.use(stripBotAtMentions);

// Configure middleware for extracting channelId
bot.use({
    // Middleware to be called as soon as any incoming event is received (even before conversation state is loaded)
    receive: function (event, next) {
        if (event.type === "message" && event.source === "slack" && event.address.conversation.isGroup && ('entities' in event)) {
            // Check whether the bot was mentioned in the incoming message
            let mentioned = (<any>event).entities.findIndex((entity: any) => {
                return (entity.type === "mention" && entity.mentioned.id === event.address.bot.id)
            });
            // Do not continue processing if this is a group message in slack that does not @mention jibe 
            // (this is to prevent the bot from responding to unrelated messages in slack)
            if (mentioned === -1) {
                return;
            }
        }
        slack.manageThreading(event);
        next();
    },
    // Middleware for incoming messages (user -> bot)
    botbuilder: function (session, next) {
        saveChannelId(session);
        next();
    },
    // Middleware for outgoing messages (bot -> user)
    // send: function (event, next) {
    //     next();
    // },
});

// Add middleware to send typing when we receive a message
bot.use(botbuilder.Middleware.sendTyping());

// Middleware for storing each conversation's channelId
// This channelId is used when storing event subscriptions in the Jibe database
// It doesn't have to be the same as the chat-client-specific channelId
function saveChannelId(session: botbuilder.Session) {
    // If we don't already have the channelId for this conversation, extract it and save it in conversationData
    if (!session.conversationData.channelId) {
        var chId = session.message.address.conversation.id;
        if (session.message.address.channelId === "msteams" && session.message.address.conversation.isGroup) {
            // For teams, use Microsoft channelId
            chId = msteams.getChannelId(session.message.address);
        }
        else if (session.message.address.channelId === "slack") {
            // For slack, use the slack-specific channelId (without the thread timestamp suffix)
            chId = slack.getSlackChannelId(session.message.address);
        }
        else if (session.message.address.channelId === "emulator") {
            // We just use the emulator for testing, so we don't want multiple emulator addresses cluttering things up
            chId = "emulator";
        }
        session.conversationData.channelId = chId;
        console.log("Saving channelId: " + session.conversationData.channelId);
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
            "Type 'ping me' to have the bot message you directly",
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
            "Type 'quit' or 'goodbye' to end the conversation",
        ]
        let msg = bullets.join('\n - ');
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

// Handle actionable card responses
connector.onO365ConnectorCardAction(o365Dialog.cardActionHandler);


// *** SEND A SAMPLE ADAPTIVECARD ***
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
    let card = slack.viewSettingsCard(subs);
    sendAdaptiveCard(session.message.address, card);
    session.endDialog("Card sent!");
}).triggerAction({
    matches: /adaptive ?card/i,
});


// *** SEND AN ACTIONABLECARD ***
bot.dialog('actionableCard', function (session) {
    session.send("Sending an actionableCard!");
    let card = msteams.sampleActionableCard;
    sendActionableCard(session.message.address, card);
    session.endDialog("Card sent!");
}).triggerAction({
    matches: /actionable ?card/i,
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
    matches: /card ?action/i,
});


// Open a one-on-one dialog with the requesting user
bot.dialog('PingMe', function (session) {
    var address = JSON.parse(JSON.stringify(session.message.address));
    // In both Teams and Slack, we can initiate a one-on-one conversation by stripping out the existing conversation info
    delete address.conversation;
    // In teams, opening a 1-on-1 chat also requires the tenant id
    if (address.channelId === 'msteams') {
        address.channelData = {
            tenant: {
                id: "68eac915-2f41-4693-a138-14c86824d964"
            }
        }
    }
    bot.send(new botbuilder.Message()
        .address(address)
        .text("Hello, %s. What can I help you with?", address.user.name.split(' ')[0])
    );
}).triggerAction({
    matches: /ping me/i,
});


// Demonstrates a dropdown menu for Slack
bot.dialog('Dropdown', [
    function (session) {
        let options = ["asdf", "2", "333"];
        slack.dropdownPrompt(session, "This is a dropdown!", "Pick one ...", options);
    },
    function (session, results) {
        session.endDialog("You selected: " + results.response.entity);
    }
]).triggerAction({
    matches: /dropdown/i,
});


// *** HANDLE CONVERSATION UPDATES ***
// Triggered on conversationUpdate event, which is sent when:
// - a channel is created
// - a user is added to the conversation
// - the bot is added to the conversation
bot.on('conversationUpdate', function (message) {

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

    // If the bot is being removed, send a goodbye message
    if (message.membersRemoved && message.membersRemoved.findIndex((m: botbuilder.IIdentity) => { return m.id === message.address.bot.id; }) >= 0) {
        bot.send(new botbuilder.Message()
            .address(message.address)
            .text('Goodbye everyone!')
        );
    }
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
// Not yet supported by teams, but is supported by other chat clients
function sendAdaptiveCard(address: botbuilder.IAddress, card: adaptiveCards.ICard) {
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
        let card = msteams.jibeEventCard(messageInfo);
        sendActionableCard(address, card);
    }
    // If sending to Slack, send a slack-formatted message
    else if (address.channelId === 'slack') {
        let card = slack.jibeEventCard(messageInfo);
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
    init,
    connector,
    bot,
    sendActionableCard,
    sendAdaptiveCard,
    sendMessage,
    sendJibeEvent
};
