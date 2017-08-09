import * as teams from 'botbuilder-teams';
import * as builder from 'botbuilder';
import * as models from '../../models/models';
import * as jibe from '../../service/jibe';
import * as conversation from '../conversation'
import * as drillplan from '../../plugins/drillplan'


// Create a card that allows the user to edit their event subscriptions
async function changeSettingsCard(session: builder.Session) {
    // Retrieve list of projects from db
    var projects: models.ProjectInfo[];
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

    let submitBtn = new teams.O365ConnectorCardHttpPOST(session)
        .id("btn")
        .name("Update Settings")
        .body(JSON.stringify({
            project: "{{project.value}}",
            events: "{{events.value}}",
        }));

    // Alternative action that specifies target
    // let submitBtn: teams.IO365ConnectorCardHttpPOST = {
    //             "id": "",
    //             "name":"Update Settings",
    //             "body":"{\"project\":\"{{project.value}}\",\"events\":\"{{events.value}}\"}",
    //             "@type":"HttpPOST",
    //             "target":"https://ueaewxjspz.localtunnel.me/connector/invoke"
    // }

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
            submitBtn
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

// Create a card that displays the current channel's event subscriptions
async function viewSettingsCard(session: builder.Session) {
    // Retrieve list of projects from db
    var subscriptions;
    try {
        subscriptions = await conversation.getSubscriptions(session.conversationData.channelId)
    } catch (e) {
        // TODO: Do something here?
        throw e;
    }

    // Create 'facts' to display subscription info for each project
    let facts = subscriptions.map((sub) => {
        return new teams.O365ConnectorCardFact(session)
            .name(sub.project)
            .value(sub.events.length > 0 ? sub.events.join(', ') : "No subscribed events");
    })

    // Create section listing subscriptions
    var section = new teams.O365ConnectorCardSection(session)
        .markdown(true)
        .activityTitle("#Subscriptions")
        .activitySubtitle("##Drillplan Events")
        .facts(facts)
        .activityImage("https://jibe.azurewebsites.net/assets/images/gear.png")

    // Create full card
    var card = new teams.O365ConnectorCard(session)
        .summary("Your Subscriptions")
        .themeColor("#0019a8")
        .sections([section])
        .potentialAction([]);

    return card;
}

export {
    changeSettingsCard as changeSettingsCard,
    viewSettingsCard as viewSettingsCard
}
