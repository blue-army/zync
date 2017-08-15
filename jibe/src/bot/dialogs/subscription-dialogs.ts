/*
 * *** EVENT SUBSCRIPTION DIALOGS ***
 */

import * as botbuilder from 'botbuilder'
import * as teams from 'botbuilder-teams'
import * as utils from '../bot-utils'
import * as conversation from '../../bot/conversation'
import * as jibe from '../../service/jibe'
import * as settingsActionableCards from '../actionableCards/settings-cards'
import * as settingsAdaptiveCard from '../adaptiveCards/current_settings'
import * as teamsCards from '../../chat/msteams'
import * as drillplan from '../../plugins/drillplan'


var bot = new botbuilder.Library('subscribe');

interface BasicProjectInfo {
    name: string;
    id: string;
}

// Creates and sends a card displaying channel subscriptions.
// Card type depends on chat client. 
function sendSubscriptions(session: botbuilder.Session, subs: conversation.Subscription[]) {
    var msg = new teams.TeamsMessage(session)
        .summary("Settings card")

    // If the conversation is on Microsoft Teams, send an ActionableCard
    if (session.message.address.channelId === 'msteams') {
        let card = teamsCards.viewSettingsCard(session, subs);
        msg.addAttachment(card);
    }
    
    // For all other platforms, send an AdaptiveCard
    else {
        let card = settingsAdaptiveCard.createCard(subs);
        msg.addAttachment({
            content: card,
            contentType: "application/vnd.microsoft.card.adaptive"
        });
    }
    session.send(msg);
}

// Root dialog
// Generates and displays a card with subscription settings
bot.dialog('/', [
    async function (session) {
        let subs: conversation.Subscription[]
        try {
            subs = await conversation.getSubscriptions(session.conversationData.channelId);
        } catch (e) {
            session.endDialog("Sorry, we were unable to retrieve your settings. Please try again later.");
            return;
        }
        // send the user their subscriptions
        sendSubscriptions(session, subs);
        botbuilder.Prompts.confirm(session, "Do you want to update your settings?");
    },
    function (session, results) {
        if (results.response) {
            // Begin project selection process. 
            session.beginDialog('selectProject');
        } else {
            session.endDialog('Ok, settings have not been changed.');
        }
    }
]).triggerAction({
    // Trigger this dialog when the user types something related to settings/subscriptions
    matches: /(^| )(settings|options|config|configure|(un)?subscribe|subscriptions|projects|events|notifications)( |$)/i
});


// Prompts user to select a project for which to edit the settings
bot.dialog('selectProject', [
    function (session) {
        // Give the user a list of projects to choose from
        jibe.getProjectList()
            .then((projects) => {
                let projectNames = projects.map((p) => p.name);
                botbuilder.Prompts.choice(session, 'Which project should we update?', projectNames, { listStyle: botbuilder.ListStyle.list });
            })
            .catch(() => {
                session.endDialog("Oops, there was a problem loading the project selection. Please try again later.")
            })
    },
    // extract project info and start dialog to change settings
    async function (session, results, next) {
        var projectName = results.response.entity;
        var projectId: string;
        try {
            // match the selected project's name to its ID
            projectId = await conversation.getProjectId(projectName);
            if (!projectId) {
                throw "Project ID not found";       // detect project ID retrieval issues
            }
        } catch (e) {
            session.send("Sorry, we could not find that project. Please try again later.");
            next();         // continue on to next step of waterfall
        }
        // pass project info to new dialog
        let projectInfo = { id: projectId, name: projectName };
        session.beginDialog('changeSettingsViaList', { "project": projectInfo });
    },
    // Display current settings, prompt user to pick another project
    async function (session) {
        // Create card
        let subs: conversation.Subscription[]
        try {
            subs = await conversation.getSubscriptions(session.conversationData.channelId);
        } catch (e) {
            session.endDialog("Sorry, we were unable to retrieve your settings. Please try again later.");
            return;
        }
        // send the user their subscriptions
        sendSubscriptions(session, subs);
        botbuilder.Prompts.confirm(session, "Would you like to update settings for another project?");
    },
    function (session, results) {
        if (results.response) {
            session.replaceDialog('selectProject');
        } else {
            session.endDialog('Ok, goodbye!');
        }
    }
])


// Prompts user to subscribe to events from a list
// Input arguments: project info
bot.dialog('changeSettingsViaList', [
    async function (session, args: { project: BasicProjectInfo }) {
        session.dialogData.project = args.project;

        // Retrieve subscription info from the db
        var subs;
        try {
            subs = await conversation.getSubscriptions(session.conversationData.channelId);
        } catch (e) {
            session.endDialog("Sorry, we were unable to load your subscriptions. Please try again later.");
            return;
        }

        // Get subscription information for the single project the user is interested in
        let projectSubs = subs.find((s) => {
            return s.project === session.dialogData.project.name;
        });

        // Tell the user which events they are already subscribed to
        if (projectSubs.events.length > 0) {
            session.send("This channel is subscribed to the following %s events: %s",
                args.project.name,
                projectSubs.events.join(', '));
        } else {
            session.send("This channel is not yet subscribed to any events from %s.", session.dialogData.project.name);
        }

        // Prompt user to subscribe or unsubscribe
        botbuilder.Prompts.choice(session, "What should we do now?", "Subscribe|Unsubscribe|Cancel", { listStyle: botbuilder.ListStyle.button });
    },
    function (session, results) {
        // Begin subscribe/unsubscribe dialog
        if (results.response.entity === "Subscribe") {
            session.beginDialog('project/subscribe', { project: session.dialogData.project });
        } else if (results.response.entity === "Unsubscribe") {
            session.beginDialog('project/unsubscribe', { project: session.dialogData.project });
        } else {
            session.endDialog("Ok, settings have not been changed.");
        }
    },
    function (session) {
        botbuilder.Prompts.confirm(session, "Continue editing this project's subscriptions?");
    },
    function (session, results) {
        // Restart the dialog if they want to subscribe to more events
        if (results.response) {
            session.replaceDialog('changeSettingsViaList', { project: session.dialogData.project });
        } else {
            session.endDialog();
        }
    }
]);


// Dialog for choosing an event to unsubscribe from
bot.dialog('project/unsubscribe', [
    function (session: botbuilder.Session, args: { project: BasicProjectInfo }) {
        // Save project info
        session.dialogData.project = args.project;

        // Send the list of events that they are currently subscribed to
        conversation.getProjectSubscriptions(session.conversationData.channelId, session.dialogData.project.id)
            .then((eventNames) => {
                // End dialog if the user is not subscribed to any events from the given project
                if (eventNames.length > 0) {
                    eventNames.push("None");
                    botbuilder.Prompts.choice(session, "Which event would you like to unsubscribe from?", eventNames, { listStyle: botbuilder.ListStyle.list });
                } else {
                    session.endDialog("You are not subscribed to any events from %s.", session.dialogData.project.name);
                }
            })
            .catch(() => {
                session.endDialog("Sorry, there was a problem retrieving your subscriptions. Please try again later.");
            })
    },
    function (session, results) {
        // Subscribe the channel to the selected event
        if (results.response.entity === "None") {
            session.endDialog("No events selected.");
        } else {
            // Update the relevant project in the database
            conversation.unsubscribe(session.dialogData.project.id, session.conversationData.channelId, [results.response.entity])
                .then(() => {
                    session.endDialog("You are no longer subscribed to %s events from %s.", results.response.entity, session.dialogData.project.name);
                })
                .catch(() => {
                    session.endDialog("Sorry, we were not able to update your subscriptions. Please try again later.");
                });
        }
    }
])


// Dialog for subscribing to an event
bot.dialog('project/subscribe', [
    async function (session, args: { project: BasicProjectInfo }) {
        // Save project info
        session.dialogData.project = args.project;

        conversation.getProjectSubscriptions(session.conversationData.channelId, session.dialogData.project.id)
            .then((subscribedEvents) => {
                var options = drillplan.events
                    .map((event: any) => {
                        return event.name;
                    })
                    .filter((name) => {
                        // Filter out events that the channel is already subscribed to
                        return (subscribedEvents.indexOf(name) === -1);
                    });
                if (options.length === 0) {
                    // Let the user know if they are already subscribed to all events
                    session.endDialog("This channel is already subscribed to all %s events", session.dialogData.project.name)
                } else {
                    // Send the list of events that they can subscribe to
                    options.push("None");
                    botbuilder.Prompts.choice(session, "Which event would you like to subscribe to?", options, { listStyle: botbuilder.ListStyle.list });
                }
            })
            .catch(() => {
                session.endDialog("Sorry, there was a problem retrieving your subscriptions. Please try again later.");
            })
    },
    function (session, results) {
        // Subscribe the channel to the selected event
        if (results.response.entity === "None") {
            session.endDialog("No events selected.");
        } else {
            // Update the relevant project in the database
            let addr: botbuilder.IAddress = utils.getChannelAddress(session);      // preprocess address
            conversation.addNotifications(session.dialogData.project.id, session.conversationData.channelId, addr, [results.response.entity])
                .then(() => {
                    session.endDialog("You are now subscribed to %s events.", results.response.entity);
                })
                .catch(() => {
                    session.endDialog("Sorry, we were not able to update your subscriptions. Please try again later.");
                });
        }
    }
])


// Display the settings card
// bot.dialog('sendSettingsCard', async function (session) {
//     let card;
//     try {
//         card = await settingsCards.viewSettingsCard(session);
//     } catch (e) {
//         session.send("Sorry, we were unable to retrieve your settings. Please try again later.");
//         return;
//     }
//     var msg = new teams.TeamsMessage(session)
//         .summary("A sample O365 actionable card")
//         .addAttachment(card);
//     session.send(msg);
//     session.endDialog();
// }).triggerAction({
//     matches: /settings ?card/i,
// });


export function createLibrary() {
    return bot.clone();
};
