import * as models from '../../models/models'
import * as adaptiveCards from 'microsoft-adaptivecards/built/schema'

// TODO: import these events from an outside file
var events = [
    {
        "name": "BHA",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^BHA&Drillstring$",
        }
    },
    {
        "name": "Bit Selection",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^Bit Selection$",
        }
    },
    {
        "name": "Drilling Fluid",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^drilling fluid$",
        }
    },
    {
        "name": "Casing Design",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^casign design$",
        }
    },
    {
        "name": "Cementing",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^define cement job$",
        }
    },
    {
        "name": "Logistics",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^logistics$",
        }
    },
    {
        "name": "Mud Design",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^mud design$",
        }
    },
    {
        "name": "Rig",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^rig$",
        }
    },
    {
        "name": "Trajectory",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^trajectory$",
        }
    },
    {
        "name": "Target",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^target$",
        }
    },
    {
        "name": "Risks",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^risks$",
        }
    }
];

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
    for (let i = 0; i < events.length; i++) {
        let col = i % ncols;
        let checkbox = new adaptiveCards.InputToggle({
            title: events[i].name,
            value: events[i].name,
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