import * as models from '../../models/models'

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
            },
            {
                "type": "TextBlock",
                "text": "Project",
                "horizontalAlignment": "center",
                "weight": "bolder",
                "size": "medium"
            },
            {
                "type": "ColumnSet",
                "columns": []
            }
        ],
            
        "actions": [
            {
            "type": "Action.Submit",
            "title": "Update Settings",
            "data": {
                "app": "drillplan",
                "project": "project"
            }
            }
        ]
    }
};

var choice_section = 2;

function createCard (project) {
    let ncols = 3;

    // Set subheader
    template.content.body[1].text = "Project " + project;

    for (let col = 0; col < ncols; col++) {
        template.content.body[choice_section].columns[col] = {
            "type": "Column",
            "items": []
        };
    }
    for (let i = 0; i < events.length; i++) {
        let col = i % ncols;
        template.content.body[choice_section].columns[col].items.push({
              "type": "Input.Toggle",
              "id": events[i].name,
              "title": events[i].name,
              "value": "false",
              "valueOn": "true",
              "valueOff": "false"
            }
        );
    }
    return template;
}

function createCard2 (project, projectId) {
    let ncols = 3;
    
    // Set subheader
    template.content.body[1].text = "Project " + project;
    template.content.actions[0].data.project = projectId;

    for (let col = 0; col < ncols; col++) {
        template.content.body[choice_section].columns[col] = {
            "type": "Column",
            "items": [
                {
                      "type": "Input.ChoiceSet",
                      "id": "col" + col,
                      "style": "expanded",
                      "isMultiSelect": true,
                      "choices": []
                }
            ]
        }
    };

    for (let i = 0; i < events.length; i++) {
        let col = i % ncols;
        template.content.body[choice_section].columns[col].items[0].choices.push({
              "title": events[i].name,
              "value": events[i].name,
              "isSelected": "false",
            }
        );
    }
    return template;
}

exports.createCard = createCard2;

// console.log(JSON.stringify(createCard2("proj")));