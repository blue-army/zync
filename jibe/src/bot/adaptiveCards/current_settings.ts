/*
 * Creates an adaptivecard displaying all events the given channel is subscribed to
 */

import * as adaptiveCards from 'microsoft-adaptivecards/built/schema'
import * as conversation from '../conversation'


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
function createCard(subscriptions: conversation.Subscription[]): adaptiveCards.ICard {

    // Create card
    let factSet = new adaptiveCards.FactSet();
    let header = new adaptiveCards.TextBlock(title)
    let card = new adaptiveCards.Card();
    card.body = [header, factSet]       // specify card content

    // Populate factset with subscription info
    factSet.facts = subscriptions.map((sub) => {
        return new adaptiveCards.Fact({
            title: sub.project,
            value: sub.events.join(', ')
        });
    })

    return card;
}

exports.createCard = createCard;

// TODO: Test This!