import * as botbuilder from 'botbuilder';
import * as models from '../models/models'
import * as adaptiveCards from 'microsoft-adaptivecards/built/schema'
import * as conversation from '../bot/conversation'

interface dropdownOption {
    text: string;
    value: string;
}

// Regex for extracting segments of the conversation id
const conversationlIdRegex = /(.{9}:.{9}:.{9}):(\d+\.\d+)/;

// Examines session address to determine whether it referrs to a thread
function isThread(session: botbuilder.Session): boolean {
    let matches = session.message.address.conversation.id.match(conversationlIdRegex);
    if (matches) {
        return true;
    }
    return false;
}

// Extracts thread timestamp from session address
// Returns an empty string if no timestamp found
function getThreadTS(session: botbuilder.Session): string {
    let matches = session.message.address.conversation.id.match(conversationlIdRegex);
    if (matches) {
        // return the timestamp, which is the last segment of the conversation address
        return matches[2];
    } else {
        return "";
    }
}

// Returns the slack channel's ID based on the session address
// If the address referrs to a thread within the channel, this returns the conversationId for the channel itself
// If the address already referrs to a channel, this returns the existing conversationId
function getSlackChannelId(address: botbuilder.IAddress): string {
    let matches = address.conversation.id.match(conversationlIdRegex);
    if (matches) {
        // return the channel's ID, group 1 of the regex
        return matches[1];
    } else {
        // If no matches, then the id does not referr to a thread and we should return the full id
        return address.conversation.id;
    }
}

// Prompt the user to select a choice from a dropdown menu
// Only works in Slack
// choices = choices to display in dropdown
// values (optional) = list of values to return when choices are selected. Must be same length as choices.
function dropdownPrompt(session: botbuilder.Session, message: string, choices: string[], values?: string[]) {

    // Create dropdown menu options (each option needs both a 'text' field and a 'value' field)
    let dropdownOptions = choices.map((choice, index) => {
        let val = choice;
        if (values) {
            val = values[index];
        }
        return {
            text: choice,
            value: val
        }
    })

    let dropdown = {
        "text": "",
        "response_type": "in_channel",
        "attachments": [
            {
                "text": message,
                "fallback": message,
                "color": "#3AA3E3",
                "attachment_type": "default",
                "callback_id": "project_selection",
                "actions": [
                    {
                        "name": "project_list",
                        "text": "Pick a project...",
                        "type": "select",
                        "options": dropdownOptions
                    }
                ],
                "thread_ts": getThreadTS(session)
            }
        ],
        "thread_ts": getThreadTS(session)
    }
    let msg = new botbuilder.Message(session)
        .sourceEvent({
            "slack": dropdown
        });
    botbuilder.Prompts.choice(session, msg, choices, { listStyle: botbuilder.ListStyle.none });
}

// Creates a Slack message displaying information about an incoming event
function jibeEvent(messageInfo: models.MessageInfo) {

    let slackMessage = {
        "text": "",
        "attachments": [
            {
                "fallback": messageInfo.activityEntityType + ' Event: ' + messageInfo.entityName,
                "color": "0078D7",
                "pretext": "",
                "author_name": "",
                "author_link": "",
                "author_icon": "",
                "title": messageInfo.activityEntityType + ': ' + messageInfo.entityName,
                "title_link": messageInfo.actionUrl,
                "text": "",
                "fields": [
                    {
                        "title": messageInfo.subtitle1,
                        "value": messageInfo.subtitle2,
                        "short": false
                    },
                    {
                        "title": "Changed by " + messageInfo.ownerFullName,
                        "value": '"' + messageInfo.comments + '"',
                        "short": false
                    }
                ],
                "thumb_url": messageInfo.typeImageUrl,
                "footer": "Jibe",
                "footer_icon": "https://jibe.azurewebsites.net/assets/connector/Taiji.png",
                "ts": Math.floor(Date.now() / 1000)
            }
        ]
    }
    return slackMessage;
}


// Creates an adaptivecard displaying all events the given channel is subscribed to
// Sample card output:
// {
//     "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
//     "type": "AdaptiveCard",
//     "version": "0.5",
//     "body": [
//         {
//             "type": "TextBlock",
//             "text": "Drillplan Notification Settings",
//             "horizontalAlignment": "center",
//             "weight": "bolder",
//             "size": "medium",
//             "separation": "strong"
//         },
//         {
//             "type": "FactSet",
//             "facts": [
//                 {
//                     "title": "Fact 1",
//                     "value": "Value 1"
//                 }
//             ]
//         }
//     ]
// }

// Input: an object mapping project names to lists of event subscriptions
function viewSettingsCard(subscriptions: conversation.Subscription[]): adaptiveCards.ICard {
    // Create and format title
    let title = new adaptiveCards.TextBlock();
    title.text = "Drillplan Notification Settings";
    title.horizontalAlignment = "center";
    title.weight = "bolder";
    title.size = "medium";

    // Create card
    let factSet = new adaptiveCards.FactSet();
    let card = new adaptiveCards.Card();
    card.body = [title, factSet]       // specify card content

    // Populate factset with subscription info
    factSet.facts = subscriptions.map((sub) => {
        let factValue = sub.events.length > 0 ? sub.events.join(', ') : "No subscribed events";
        return new adaptiveCards.Fact({
            title: sub.project,
            value: factValue
        });
    })

    return card;
}

// Middleware function that creates a new thread when responding to a top-level user comment in a multi-user slack channel
// This is the only case in which we have to modify the address - once the thread is created, the bot will automatically reply within the thread
function manageThreading(event: botbuilder.IEvent) {
    console.log("Conversation: ", event.address.conversation)
    // Check that we are in a group conversation and the relevant slack-specific properties are defined. 
    if (event.address.channelId === "slack" && event.address.conversation.isGroup && event.sourceEvent && event.sourceEvent.SlackMessage) {
        let slackEvent = event.sourceEvent.SlackMessage.event;
        if (slackEvent) {
            // Detect top-level comments (slack comments without a thread_ts property)
            if (!slackEvent.thread_ts && slackEvent.ts) {
                // append root-level comment timestamp to conversation ID to start a new thread
                event.address.conversation.id += ':' + slackEvent.ts;
                slackEvent.thread_ts = slackEvent.ts;
                // Delete message id (to allow separate threads to have separate conversation states)
                if (event.address.id) {
                    delete event.address.id;
                }
                console.log("reassigned group ID: " + event.address.conversation.id);
            }
        }
    }
}

export {
    // Cards/messages
    dropdownPrompt,
    jibeEvent,
    viewSettingsCard,

    // Slack-specific utilities
    manageThreading,
    getSlackChannelId
}