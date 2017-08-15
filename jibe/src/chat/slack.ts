import * as botbuilder from 'botbuilder';
import * as models from '../models/models'
import * as adaptiveCards from 'microsoft-adaptivecards/built/schema'
import * as conversation from '../conversation'

interface dropdownOption {
    text: string;
    value: string;
}

// Prompt the user to select a choice from a dropdown menu
// Only works in Slack
function dropdownPrompt(session: botbuilder.Session, message: string, choices: (string|dropdownOption)[]) {
    let stringOptions = choices.map((choice) => {
        if (typeof choice === 'string') {
            return choice;
        } else {
            return choice.value;
        }
    })
    
    let dropdownOptions = choices.map((choice) => {
        if (typeof choice === 'string') {
            return {
                text: choice,
                value: choice
            }
        } else {
            return choice;
        }
    });
    let dropdown = {
        "text": "Would you like to play a game?",
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
                ]
            }
        ]
    }
    let msg = new botbuilder.Message(session)
        .sourceEvent({
            "slack": dropdown
        });
    botbuilder.Prompts.choice(session, msg, stringOptions, { listStyle: botbuilder.ListStyle.none });
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
    // Title formatting info
    var title : adaptiveCards.TextBlock = {
        "type": "TextBlock",
        "text": "Drillplan Notification Settings",
        "horizontalAlignment": "center",
        "weight": "bolder",
        "size": "medium",
    }

    // Create card
    let factSet = new adaptiveCards.FactSet();
    let header = new adaptiveCards.TextBlock(title)
    let card = new adaptiveCards.Card();
    card.body = [header, factSet]       // specify card content

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


export {
    dropdownPrompt,
    jibeEvent,
    viewSettingsCard
}