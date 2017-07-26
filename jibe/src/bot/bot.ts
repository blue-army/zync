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
    bot.send(new builder.Message()
        .address(message.address)
        .text("conversationUpdate Event: " + JSON.stringify(message)));

    if (message.membersAdded && message.membersAdded.length > 0) {
        var membersAdded = message.membersAdded
            .map(function (m) {
                var isSelf = m.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : m.name) || '' + ' (Id: ' + m.id + ')';
            })
            .join(', ');

        bot.send(new builder.Message()
            .address(message.address)
            .text('Welcome ' + membersAdded));
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
