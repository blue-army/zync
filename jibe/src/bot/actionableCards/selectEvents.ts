import * as teams from 'botbuilder-teams';
import * as builder from 'botbuilder';
import * as models from '../../models/models';
import * as jibe from '../../service/jibe';

// Import drillplan events
var drillplan = require('../events/drillplan')

async function createCard(session: builder.Session) {
    // Retrieve list of projects from db
    var projects : models.ProjectInfo[];
    try {
        projects = await jibe.getProjectList();
    } catch (e) {
        return;
    }

    // Create list of projects to display
    let projectChoices = projects.map((proj) => {
        return new teams.O365ConnectorCardMultichoiceInputChoice(session)
            .display(proj.name)
            .value(proj.id)
    })

    // Create list of events to display
    let eventChoices = drillplan.events.map((event: any) => {
        return new teams.O365ConnectorCardMultichoiceInputChoice(session)
            .display(event.name)
            .value(event.name)
    })

    // Create action section
    let actionCard1 = new teams.O365ConnectorCardActionCard(session)
                    .id("card-1")
                    .name("Multiple Choice")
                    .inputs([
                        // Create a drop-down menu for project selection
                        new teams.O365ConnectorCardMultichoiceInput(session)
                            .id("project")
                            .title("Select a project")
                            .isMultiSelect(false)
                            .isRequired(true)
                            .style('compact')
                            .choices(projectChoices),

                        // Create check-boxes for event selection
                        new teams.O365ConnectorCardMultichoiceInput(session)
                            .id("events")
                            .title("Select events")
                            .isMultiSelect(true)
                            .isRequired(true)
                            .style('expanded')
                            .choices(eventChoices),
                    ])
                    .actions([
                        new teams.O365ConnectorCardHttpPOST(session)
                        .id("card-1-btn-1")
                        .name("Send")
                        .body(JSON.stringify({
                            list1: '{{project.value}}',
                            list2: '{{events.value}}',
                        }))
                    ]);

    // Create full card
    let card = new teams.O365ConnectorCard(session)
                .summary("Select Events")
                .themeColor("#E67A9E")
                .title("Event Selection")
                .text("Drillplan Events")
                //.sections([section])
                .sections([])
                .potentialAction([
                    actionCard1
                ])

    return card;
}

export {
    createCard as createCard,
}
