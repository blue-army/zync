var builder = require('botbuilder');

// Create connector
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID || "",
    appPassword: process.env.MICROSOFT_APP_PASSWORD || "" 
});

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session: any) {
    session.send("You said: %s", session.message.text);
});

export {
    connector as connector,
};