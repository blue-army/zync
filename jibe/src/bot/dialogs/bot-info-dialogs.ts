// This file contains dialogs that convey information about the conversation and its participants, 
// such as channels, user IDs, addresses, and other message information.

import * as builder from 'botbuilder';
import * as utils from '../bot-utils'


interface IDialog {
    name: string,
    dialog: (session: builder.Session) => void,
}

// Dialog to display info on the current channel
var channelInfo: IDialog = {
    name: 'channelInfo',
    dialog: function (session: builder.Session) {
        utils.fetchChannelList(session)
            .then((channels) => {
                let channel = channels.find((channel) => {
                    return channel.id === session.message.sourceEvent.teamsChannelId;
                });
                // If using emulator, just display the first channel in the list
                if (session.message.address.channelId === 'emulator' && channels.length > 0) {
                    channel = channels[0];
                }
                if (!channel) {
                    throw "Current channel not found in channel list."
                }
                let msg = "Your current channel: \n" + utils.JsonToBullets(channel);
                session.endDialog(msg);
            })
            .catch((err) => {
                session.endDialog("There was a problem retrieving the channel info. Please try again later.");
                console.log("Error retrieving channels", err);
            })
    }
}

// Dialog to get info on all channels in the team
var teamInfo: IDialog = {
    name: 'teamInfo',
    dialog: function (session: builder.Session) {
        utils.fetchChannelList(session)
            .then((channels) => {
                let msg = "Channels in this team: \n" + utils.JsonToMarkdown(channels);
                session.endDialog(msg);
            })
            .catch((err) => {
                session.endDialog("There was a problem retrieving the channel info. Please try again later.")
                console.log("Error retrieving channels", err)
            })
    }
}

// Send info on the message's sender
var userInfo: IDialog = {
    name: 'userInfo',
    dialog: function (session: builder.Session) {
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
                console.log("Error retrieving team members", err);
            });
    }
}

// Send information on all users in the channel
var allUsers: IDialog = {
    name: 'allUsers',
    dialog: function (session: builder.Session) {
        utils.fetchChannelMembers(session)
            .then((users) => {
                let msg = "Channel Users: \n" + utils.JsonToMarkdown(users);
                session.endDialog(msg);
            })
            .catch((err) => {
                session.endDialog("There was a problem retrieving the user info. Please try again later.");
                console.log("Error retrieving team members", err);
            });
    }
}

// Format and send most recent message's payload
var payloadDialog: IDialog = {
    name: 'payload',
    dialog: function (session) {
        let msg = "**Your most recent message:**\n" + utils.JsonToYamlMd(session.message);
        session.send(new builder.Message()
            .text(msg)
            .textFormat("markdown")
        );
    }
}

// Send the user their address
var addressDialog: IDialog = {
    name: 'address',
    dialog: function (session) {
        let msg = "**Your address:**\n" + utils.JsonToBullets(session.message.address);
        session.send(new builder.Message()
            .text(msg)
            .textFormat('markdown'));
    }
}

export {
    // Teams-specific dialogs
    channelInfo as channelInfoDialog,
    teamInfo as teamInfoDialog,
    userInfo as userInfoDialog,
    allUsers as allUsersDialog,

    // General message info dialogs
    payloadDialog as payloadDialog,
    addressDialog as addressDialog
}