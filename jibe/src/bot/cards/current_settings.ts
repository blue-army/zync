var template = {
    "contentType": "application/vnd.microsoft.card.adaptive",
    "content": {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "0.5",
        "body": [
            {
                "type": "TextBlock",
                "text": "Drillplan Notification Settings",
                "horizontalAlignment": "center",
                "weight": "bolder",
                "size": "medium",
                "separation": "strong"
            },
            {
                "type": "FactSet",
                "facts": [
                    {
                        "title": "Fact 1",
                        "value": "Value 1"
                    }
                ]
            }
        ]
    }
}

// Input: an object mapping project names to lists of subscriptions
function createCard(subscriptions) {
    template.content.body[1].facts = [];
    for (let project in subscriptions) {
        template.content.body[1].facts.push({
            "title": project,
            "value": subscriptions[project].join(', ')
        });
    }
    return template;
}

exports.createCard = createCard;

// testing
// var subs = {
//     "proj1": ["asdf", "wells", "mud"],
//     "proj2": ["a", 'b', 'c']
// }
// console.log(JSON.stringify(createCard(subs)));