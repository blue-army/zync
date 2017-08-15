import * as botbuilder from 'botbuilder';
import * as models from '../models/models'

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

export {
    dropdownPrompt,
    jibeEvent
}