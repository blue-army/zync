// This file contains dialogs that convey information about the conversation and its participants, 
// such as channels, user IDs, addresses, and other message information.

import * as builder from 'botbuilder';
import * as utils from '../bot-utils'
import * as logger from '../../service/logger'


var lib = new builder.Library('subscribe');

// *** SEND CURRENT CHANNEL INFO ***
// Dialog to display info on the current channel
lib.dialog('channelInfo',
    function (session: builder.Session) {
        // Check that microsoft teams is being used
        if (session.message.address.channelId !== 'msteams') {
            session.endDialog("Sorry, this feature is only available in Microsoft Teams");
            return;
        }
        utils.fetchChannelList(session)
            .then((channels) => {
                let channel = channels.find((channel) => {
                    return channel.id === session.message.sourceEvent.teamsChannelId;
                });
                if (!channel) {
                    // go to catch clause
                    throw "Current channel not found in channel list."
                }
                let msg = "Your current channel: \n" + utils.JsonToBullets(channel);
                session.endDialog(msg);
            })
            .catch((err) => {
                session.endDialog("There was a problem retrieving the channel info. Please try again later.");
                logger.Info("Error retrieving channels: " + JSON.stringify(err));
            })
    }
).triggerAction({
    matches: /channel( ?info)?/i,
});


// *** SEND CURRENT TEAM INFO ***
// Dialog to get info on all channels in the team
lib.dialog('teamInfo',
    function (session: builder.Session) {
        // Check that microsoft teams is being used
        if (session.message.address.channelId !== 'msteams') {
            session.endDialog("Sorry, this feature is only available in Microsoft Teams");
            return;
        }
        utils.fetchChannelList(session)
            .then((channels) => {
                let msg = "Channels in this team: \n" + utils.JsonToMarkdown(channels);
                session.endDialog(msg);
            })
            .catch((err) => {
                session.endDialog("There was a problem retrieving the channel info. Please try again later.")
                logger.Info("Error retrieving channels" + JSON.stringify(err));
            })
    }
).triggerAction({
    matches: /team( ?info)?/i,
});


// *** SEND CURRENT USER'S INFO ***
// Send info on the message's sender
lib.dialog('userInfo',
    function (session: builder.Session) {
        // Check that microsoft teams is being used
        if (session.message.address.channelId !== 'msteams') {
            session.endDialog("Sorry, this feature is only available in Microsoft Teams");
            return;
        }
        utils.fetchChannelMembers(session)
            .then((users) => {
                let user = users.find((u) => {
                    return u.id === session.message.address.user.id;
                });
                if (!user) {
                    throw "Current user not found in user list";    // go to catch
                }
                let msg = "Your info: \n" + utils.JsonToBullets(user);
                session.endDialog(msg);
            })
            .catch((err) => {
                session.endDialog("There was a problem retrieving your user info. Please try again later.");
                logger.Info("Error retrieving team members" + JSON.stringify(err));
            });
    }
).triggerAction({
    matches: /my ?info|whoami|user ?info/i,
});


// *** SEND ALL USERS' INFO ***
// Send information on all users in the channel
lib.dialog('allUsers',
    function (session: builder.Session) {
        // Check that microsoft teams is being used
        if (session.message.address.channelId !== 'msteams') {
            session.endDialog("Sorry, this feature is only available in Microsoft Teams");
            return;
        }
        utils.fetchChannelMembers(session)
            .then((users) => {
                let msg = "Channel Users: \n" + utils.JsonToMarkdown(users);
                session.endDialog(msg);
            })
            .catch((err) => {
                session.endDialog("There was a problem retrieving the user info. Please try again later.");
                logger.Info("Error retrieving team members" + JSON.stringify(err));
            });
    }
).triggerAction({
    matches: /all ?(the )?(users|members)/i,
});


// *** SEND MESSAGE PAYLOAD ***
// Format and send most recent message's payload
lib.dialog('payload', function () { }).triggerAction({
    matches: /payload|body|request|message/i,
    // (override the default behavior of replacing the stack)
    onSelectAction: 
        function (session) {
            let msg = "Your most recent message:\n" + utils.JsonToMarkdown(session.message);
            session.send(new builder.Message()
                .text(msg)
                .textFormat("markdown")
            );
        }
});


// *** SEND USER ADDRESS ***
// Send the user their address
lib.dialog('address', () => { }).triggerAction({
    matches: /address/i,
    // (override the default behavior of replacing the stack)
    onSelectAction: 
        function (session) {
            let msg = "Your address:\n" + utils.JsonToBullets(session.message.address);
            session.send(new builder.Message()
                .text(msg)
                .textFormat('markdown'));
        }
});

export {
    lib
}