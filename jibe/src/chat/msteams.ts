import * as teams from 'botbuilder-teams';
import * as botbuilder from 'botbuilder';
import * as models from '../models/models';
import * as conversation from '../bot/conversation'
import * as drillplan from '../plugins/drillplan'


// Extract the real channelId from the ID returned by teams
// This is NOT the MSTeams channelId, this is the underlying channel ID that can be used with the Microsoft Graph API
function getChannelId(address: botbuilder.IAddress) {
    let teamsId = address.conversation.id;
    var re = /^\d\d:(\S+)@thread\.skype/;
    var results = re.exec(teamsId);
    if (results && results.length > 0) {
        return results[1];          // return extracted ID
    }
    console.log("Could not extract an ID from ", teamsId);
    return teamsId;
}

// Returns the MSTeams channel's ID based on the session address
// If the address referrs to a thread within the channel, this returns the conversationId for the channel itself
// If the address already referrs to a channel, this returns the existing conversationId
function getTeamsChannelId(address: botbuilder.IAddress) {
    return address.conversation.id.split(';')[0];
}

// Create a card that allows the user to edit their event subscriptions
function changeSettingsCard(session: botbuilder.Session, projects: models.ProjectInfo[]) {

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
function viewSettingsCard(session: botbuilder.Session, subscriptions: conversation.Subscription[]) {

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

function jibeEventCard(messageInfo: models.MessageInfo): teams.O365ConnectorCard {

    // Section displaying event details
    let eventInfoSection = new teams.O365ConnectorCardSection()
        .activityImage(messageInfo.typeImageUrl)
        .activityTitle(messageInfo.subtitle1)
        .activitySubtitle(messageInfo.subtitle2);

    // Section displaying user's name and image
    let userInfoSection = new teams.O365ConnectorCardSection()
        .activityTitle("Changed by " + messageInfo.ownerFullName)
        .activitySubtitle('*"' + messageInfo.comments + '"*');

    // Detect malformed/empty image urls and replace them with a default image
    // We check image url formatting because image urls that do not begin with 'http://' or 'https://' (including empty strings) will cause the request to be rejected by ms teams with Error: 400 Bad Request.
    if (messageInfo.userImageUrl && messageInfo.userImageUrl.search("^https?:\/\/") === 0) {
        userInfoSection.activityImage(messageInfo.userImageUrl);
    } else {
        userInfoSection.activityImage("https://jibe.azurewebsites.net/assets/images/user_symbol_blue_small.png")
    }

    // Create settings button
    // let settingsButton = new teams.O365ConnectorCardViewAction()
    //     .name("\u2699")
    //     .target(messageInfo.actionUrl);

    // Create 'launch application' button
    let launchButton = new teams.O365ConnectorCardViewAction()
        .name("Launch Application")
        .target(messageInfo.actionUrl);

    // Create full card
    let card = new teams.O365ConnectorCard()
        .summary("Event Notification")
        .themeColor("0078D7")
        .title(messageInfo.activityEntityType + ': ' + messageInfo.entityName)
        .sections([eventInfoSection, userInfoSection])
        .potentialAction([launchButton]);
    return card;
}

// A sample actionable card
var sampleActionableCard = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "summary": "Miguel Garcia commented on Trello",
    "title": "Project Tango",
    "sections": [
        {
            "activityTitle": "Miguel Garcia commented",
            "activitySubtitle": "On Project Tango",
            "activityText": "\"Here are the designs\"",
            "activityImage": "http://connectorsdemo.azurewebsites.net/images/MSC12_Oscar_002.jpg"
        },
        {
            "title": "Details",
            "facts": [
                {
                    "name": "Labels",
                    "value": "Designs, redlines"
                },
                {
                    "name": "Due date",
                    "value": "Dec 7, 2016"
                },
                {
                    "name": "Attachments",
                    "value": "[final.jpg](http://connectorsdemo.azurewebsites.net/images/WIN14_Jan_04.jpg)"
                }
            ]
        },
        {
            "title": "Images",
            "images": [
                {
                    "image": "http://connectorsdemo.azurewebsites.net/images/MicrosoftSurface_024_Cafe_OH-06315_VS_R1c.jpg"
                },
                {
                    "image": "http://connectorsdemo.azurewebsites.net/images/WIN12_Scene_01.jpg"
                },
                {
                    "image": "http://connectorsdemo.azurewebsites.net/images/WIN12_Anthony_02.jpg"
                }
            ]
        }
    ],
    "potentialAction": [
        {
            "@context": "http://schema.org",
            "@type": "ViewAction",
            "name": "View in Trello",
            "target": [
                "https://trello.com/c/1101/"
            ]
        }
    ]
}


export {
    // Cards
    changeSettingsCard,
    viewSettingsCard,
    sampleActionableCard,
    jibeEventCard,

    // Utils
    getChannelId,
    getTeamsChannelId
}
