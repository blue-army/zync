import * as builder from 'botbuilder';
import * as teams from 'botbuilder-teams';
import * as jibeBot from './bot'
import * as logger from '../service/logger'
var YAML = require('yamljs');


// Extract the real channelId from the ID returned by teams
function extractId(teamsId: string) {
    var re = /^\d\d:(\S+)@thread\.skype/;
    var results = re.exec(teamsId);
    if (results && results.length > 0) {
        return results[1];          // return extracted ID
    }
    console.log("Could not extract an ID from ", teamsId);
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
function fetchChannelMembers(session: builder.Session): Promise<teams.ChannelAccount[]> {
    return new Promise(function (resolve, reject) {
        if (session.message.address.channelId !== 'msteams') {
            reject("This feature is only available when using Microsoft Teams");
            return;
        }
        var conversationId = session.message.address.conversation.id;
        jibeBot.connector.fetchMembers(
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
function fetchChannelList(session: builder.Session): Promise<teams.ChannelInfo[]> {
    return new Promise(function (resolve, reject) {
        if (session.message.address.channelId !== 'msteams') {
            reject("This feature is only available when using Microsoft Teams");
            return;
        }
        var teamId = session.message.sourceEvent.team.id;
        jibeBot.connector.fetchChannelList(
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
    extractId as extractId,

    // Teams-specific info retrieval
    fetchChannelList as fetchChannelList,
    fetchChannelMembers as fetchChannelMembers,

    // Message Formatting
    JsonToBullets as JsonToBullets,
    JsonToMarkdown as JsonToMarkdown,
    JsonToYamlMd as JsonToYamlMd
}