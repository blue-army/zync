import * as builder from 'botbuilder';
import * as teams from 'botbuilder-teams';
import * as logger from '../service/logger';
import * as slack from '../chat/slack';
import * as msteams from '../chat/msteams';
var YAML = require('yamljs');

export interface IDialog {
    name: string,
    dialog: (session: builder.Session) => void,
}

// Extract and save the channel address
function getChannelAddress(session: builder.Session): builder.IAddress {
    // This preprocessing is only necessary for MS Teams addresses because they reference a thread within the channel
    if (!session.conversationData.channelAddress) {
        // perform deep copy of address
        let address: builder.IAddress = JSON.parse(JSON.stringify(session.message.address));

        // If we are using an app that supports threads, extract the channel ID from the thread ID
        if (session.message.address.channelId === "msteams") {
            address.conversation.id = msteams.getTeamsChannelId(address);
        } else if (session.message.address.channelId === "slack") {
            address.conversation.id = slack.getSlackChannelId(address);
        }

        // Remove user info (not needed for routing to group chats)
        if (address.conversation.isGroup) {
            delete address.user;
        }

        // delete 'id' entry (links to specific context)
        if ('id' in address) {
            delete address.id;
        }

        // Save in conversation data
        session.conversationData.channelAddress = address;
    }
    return session.conversationData.channelAddress;
}


// *** FORMATTING ***
// Transform JSON object into markdown-formatted bullet points
function JsonToBullets(obj: any) {
    let msg = JSON.stringify(obj, null, 3);     // add indentation
    msg = msg.replace(/(\s\s\s)+/g, (match) => { return match + '- '; });     // add bullets
    msg = msg.replace(/- +},/g, "");            // remove closing braces
    msg = msg.replace(/["{},]/g, "");           // remove additional characters
    return msg;
}

// Format a JSON object to be readable within a ms teams message
// Message's textFormat property must be set to 'markdown'
function JsonToMarkdown(obj: any) {
    return "```\n" + JSON.stringify(obj, null, 3) + '```'
}

// Serialize an object as YAML and format it to be readable within a ms teams message
// Message's textFormat property must be set to 'markdown'
function JsonToYamlMd(obj: any) {
    return "```\n" + YAML.stringify(obj, 3) + '```'
}

// *** TEAMS-SPECIFIC INFORMATION RETRIEVAL ***
// Get info on all channel members
function fetchChannelMembers(session: builder.Session, connector: teams.TeamsChatConnector): Promise<teams.ChannelAccount[]> {
    return new Promise(function (resolve, reject) {
        if (session.message.address.channelId !== 'msteams') {
            reject("This feature is only available when using Microsoft Teams");
            return;
        }
        var conversationId = session.message.address.conversation.id;
        connector.fetchMembers(
            (<builder.IChatConnectorAddress>session.message.address).serviceUrl,
            conversationId,
            (err, result) => {
                if (err) {
                    logger.Info("Error retrieving member list for channel " + session.conversationData.channelId + ': ' + err)
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
    }
    );
}

// Get info on all channels in this team
function fetchChannelList(session: builder.Session, connector: teams.TeamsChatConnector): Promise<teams.ChannelInfo[]> {
    return new Promise(function (resolve, reject) {
        if (session.message.address.channelId !== 'msteams') {
            reject("This feature is only available when using Microsoft Teams");
            return;
        }
        var teamId = session.message.sourceEvent.team.id;
        connector.fetchChannelList(
            (<builder.IChatConnectorAddress>session.message.address).serviceUrl,
            teamId,
            (err, result) => {
                if (err) {
                    logger.Info("Error retrieving channel list for team " + session.message.sourceEvent.team.id + ': ' + err)
                    reject(err);
                }
                else {
                    resolve(result);
                }
            }
        );
    });
}

export {
    getChannelAddress,

    // Teams-specific info retrieval
    fetchChannelList,
    fetchChannelMembers,

    // Message Formatting
    JsonToBullets,
    JsonToMarkdown,
    JsonToYamlMd,
}