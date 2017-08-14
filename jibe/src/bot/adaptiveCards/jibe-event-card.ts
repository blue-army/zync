/*
 * Creates an adaptivecard displaying all events the given channel is subscribed to
 */

import * as adaptiveCards from 'microsoft-adaptivecards/built/schema'
import * as conversation from '../conversation'
import * as models from '../../models/models'




// Input: an object mapping project names to lists of event subscriptions
function createCard(messageInfo: models.MessageInfo): adaptiveCards.ICard {
    // Create and format title
    let title = new adaptiveCards.TextBlock();
    title.text = messageInfo.activityEntityType + ': ' + messageInfo.entityName;
    title.horizontalAlignment = "center";
    title.size = "medium";
    title.weight = "bolder";

    let eventInfoSection = new adaptiveCards.ColumnSet();
    
    let eventImage = new adaptiveCards.Image();
    eventImage.url = messageInfo.typeImageUrl;
    let eventCol1 = new adaptiveCards.Column();
    eventCol1.items = [eventImage];

    let eventTitle = new adaptiveCards.TextBlock();
    eventTitle.text = messageInfo.subtitle1;
    let eventText = new adaptiveCards.TextBlock();
    eventText.text = messageInfo.subtitle2;
    let eventCol2 = new adaptiveCards.Column();
    eventCol2.items = [eventTitle, eventText];

    eventInfoSection.columns = [eventCol1, eventCol2];


    // Title formatting info
    // var title : adaptiveCards.TextBlock = {
    //     "type": "TextBlock",
    //     "text": "Drillplan Notification Settings",
    //     "horizontalAlignment": "center",
    //     "weight": "bolder",
    //     "size": "medium",
    // }

    // Create card
    // let factSet = new adaptiveCards.FactSet();
    // let header = new adaptiveCards.TextBlock(title)
    let card = new adaptiveCards.Card();
    card.body = [title, eventInfoSection]       // specify card content

    // Populate factset with subscription info
    // factSet.facts = subscriptions.map((sub) => {
    //     let factValue = sub.events.length > 0 ? sub.events.join(', ') : "No subscribed events";
    //     return new adaptiveCards.Fact({
    //         title: sub.project,
    //         value: factValue
    //     });
    // })

    return card;
}

export {
    createCard,
}

// TODO: Test This!