import * as adaptiveCards from 'microsoft-adaptivecards/built/schema'
import * as drillplan from '../../plugins/drillplan'

// Sample output
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
//         },
//         {
//             "type": "TextBlock",
//             "text": "Project",
//             "horizontalAlignment": "center",
//             "weight": "bolder",
//             "size": "medium"
//         },
//         {
//             "type": "ColumnSet",
//             "columns": []
//         }
//     ],
        
//     "actions": [
//         {
//         "type": "Action.Submit",
//         "title": "Update Settings",
//         "data": {
//             "app": "drillplan",
//             "project": "project",
//             "projectId": "id"
//         }
//         }
//     ]
// }


// Set number of columns to display
const ncols = 3;

// Formatting for title
var header : adaptiveCards.ITextBlock = {
    "type": "TextBlock",
    "text": "Drillplan Notification Settings",
    "horizontalAlignment": "center",
    "weight": "bolder",
    "size": "medium",
}

// Formatting for subtitle
var subheader : adaptiveCards.ITextBlock = {
    "type": "TextBlock",
    "text": "Project",
    "horizontalAlignment": "center",
    "weight": "bolder",
    "size": "medium"
}

// Create card for the specified project
function createCard (project: string, projectId: string) {

    // Create title, subtitle, and columns
    let title = new adaptiveCards.TextBlock(header);
    let subtitle = new adaptiveCards.TextBlock(subheader);
    subtitle.text = "Project " + project;
    let options = new adaptiveCards.ColumnSet();

    // Create submit button, specify additional fields to submit
    let submitBtn = new adaptiveCards.ActionSubmit();
    submitBtn.title = "Update Settings";
    submitBtn.type = "Action.Submit";
    submitBtn.data = {
        "app": "drillplan",
        "project": project,
        "projectId": projectId
    };

    // Create card
    let card = new adaptiveCards.Card();
    card.body = [title, subtitle, options];
    card.actions = [submitBtn];

    // Create columns
    for (let col = 0; col < ncols; col++) {
        options.columns.push(new adaptiveCards.Column());
    }

    // Fill columns with event options
    for (let i = 0; i < drillplan.events.length; i++) {
        let col = i % ncols;
        let checkbox = new adaptiveCards.InputToggle({
            title: drillplan.events[i].name,
            value: drillplan.events[i].name,
            valueOn: "true",
            valueOff: "false",
        })
        options.columns[col].items.push(checkbox);
    }

    return card;
}


exports.createCard = createCard;

// Testing
// console.log(JSON.stringify(createCard("proj", "id")));