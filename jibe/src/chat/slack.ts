import * as botbuilder from 'botbuilder';


interface dropdownOption {
    text: string;
    value: string;
}

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

export {
    dropdownPrompt
}