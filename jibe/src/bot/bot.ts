var builder = require('botbuilder');

// Create connector
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID || "",
    appPassword: process.env.MICROSOFT_APP_PASSWORD || "" 
});



// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session: any) {
    session.send("You said: %s", session.message.text);
    session.send("Your address: %s", JSON.stringify(session.message.address));
});

// bot.dialog('/', 
//     function (session) {
//         session.send("You said: %s", session.message.text);
//         session.send("Your address: %s", JSON.stringify(session.message.address));
//     });

bot.dialog('settings', [
   function (session) {
        session.send("You are currently subscribed to: ")
        builder.Prompts.confirm(session, "Do you want to update your settings?");
   },
   function (session, results) {
      if (results.response) {
         session.send('Great! Your settings have been updated.');
      } else {
         session.beginDialog('Ok, settings have not been changed.');
      }
   }
]);


bot.on('conversationUpdate', function (message) {

    // Extract team and channel info if the message was sent from MS Teams
    if (message.address.channelId === "msteams") {
        
        // TODO: check if this is a group chat before channel extraction
        var channel = message.address.conversation.id;
        var team = message.sourceEvent.team;

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
        })

        // If the bot was just added to the channel, send an introduction message
        if (botIndex >= 0) {
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

function sendCard(address, message) {
    bot.send(new builder.Message()
        .addAttachment(message)
        .address(address)
    );
}

export {
    connector as connector,
    sendCard as sendCard
};
