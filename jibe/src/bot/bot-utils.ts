import * as builder from 'botbuilder';
import * as teams from 'botbuilder-teams';
import * as jibeBot from './bot'
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

// Transform JSON object into markdown-formatted bullet points
function JsonToBullets(obj: any) {
    let msg = JSON.stringify(obj, null, 3);     // add indentation
    msg = msg.replace(/(\s\s\s)+/g, (match) => {return match + '- ';});     // add bullets
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


var defaultUsers: teams.ChannelAccount[] = [
{
    "id": "29:1URzNQM1x1PNMr1D7L5_lFe6qF6gEfAbkdG8_BUxOW2mTKryQqEZtBTqDt10-MghkzjYDuUj4KG6nvg5lFAyjOLiGJ4jzhb99WrnI7XKriCs",
    "objectId": "6b7b3b2a-2c4b-4175-8582-41c9e685c1b5",
    "givenName": "Rick",
    "surname": "Stevens",
    "email": "Rick.Stevens@company.com",
    "userPrincipalName": "rstevens@company.com"
}
]

var defaultChannels: teams.ChannelInfo[] = [
    {
        "id": "19:033451497ea84fcc83d17ed7fb08a1b6@thread.skype",
        "name": null
    }, {
        "id": "19:cc25e4aae50746ecbb11473bba24c70a@thread.skype",
        "name": "Materials"
    }, {
        "id": "19:b7b84cba410c406ba671dbbf5e0a3519@thread.skype",
        "name": "Design"
    }
]


// Get info on all channel members
function fetchChannelMembers(session: builder.Session): Promise<teams.ChannelAccount[]> {
    if (session.message.address.channelId === 'emulator') {
        return Promise.resolve(defaultUsers);
    }
    return new Promise(function(resolve, reject) {
        var conversationId = session.message.address.conversation.id;
        jibeBot.connector.fetchMembers(
            (<builder.IChatConnectorAddress>session.message.address).serviceUrl,
            conversationId,
            (err, result) => {
                if (err) {
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
    if (session.message.address.channelId === 'emulator') {
        return Promise.resolve(defaultChannels);
    }
    return new Promise(function(resolve, reject) {
      var teamId = session.message.sourceEvent.team.id;
      jibeBot.connector.fetchChannelList(
        (<builder.IChatConnectorAddress>session.message.address).serviceUrl,
        teamId,
        (err, result) => {
          if (err) {
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