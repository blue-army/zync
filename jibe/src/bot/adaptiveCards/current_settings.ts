import * as models from '../../models/models'
import * as adaptiveCards from 'microsoft-adaptivecards/built/schema'

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


// Title formatting info
var title : adaptiveCards.TextBlock = {
    "type": "TextBlock",
    "text": "Drillplan Notification Settings",
    "horizontalAlignment": "center",
    "weight": "bolder",
    "size": "medium",
}

// Input: an object mapping project names to lists of event subscriptions
function createCard(subscriptions: {[key:string]: string[]}): adaptiveCards.ICard {

    // Create card
    let factSet = new adaptiveCards.FactSet();
    let header = new adaptiveCards.TextBlock(title)
    let card = new adaptiveCards.Card();
    card.body = [header, factSet]       // specify card content

    // Populate factset with subscription info
    for (let project in subscriptions) {
        let f = new adaptiveCards.Fact({
            title: project,
            value: subscriptions[project].join(', ')
        });
        factSet.facts.push(f);
    }

    return card;
}

exports.createCard = createCard;