import * as models from "../models/models";
import * as jibe from '../service/jibe';
import * as logger from '../service/logger';
import * as drillplan from "../plugins/drillplan"
import * as botbuilder from 'botbuilder'


// Define an object for storing subscription information
class Subscription {
    project: string;        // Jibe project name
    events: string[];       // events that the given channel is subscribed to.
}

// Add a channel to the given ProjectInfo object
function addChannel(project: models.ProjectInfo, channelId: string, botaddress: botbuilder.IAddress) {
    // See if there is already a channel for this ID
    let chindex = project.channels.findIndex((element) => {
        return element.id === channelId;
    });

    if (chindex === -1) {
        // add a new channel object to the project
        // TODO: retrieve channel name from graph API?
        project.channels.push(models.ChannelInfo.fromObj({
            name: "",
            id: channelId,
            webhook: "",
            botaddress: botaddress
        }));

    } else {
        // add botaddress to an existing channel object
        project.channels[chindex].botaddress = botaddress;
    }
}

// Add a route to the given project
function addRoute(project: models.ProjectInfo, channelId: string, eventName: string) {
    // look up event info in the events array
    let event = drillplan.events.find((element) => {
        return element.name === eventName;
    });

    if (!event) {
        logger.Info("Unknown event requested: " + eventName);
        return;
    }

    // Check that the channel is not already subscribed to this event
    var match = project.routes.findIndex((r) => {
            return r.channelId === channelId && r.expr === event.rule.expr;
        });
    if (match >= 0) {
        logger.Info("Channel " + channelId + " is already subscribed to " + eventName + " events.")
        return;
    }

    // Create new route and add to project
    let route = models.RouteInfo.fromObj({
        path: event.rule.path,
        expr: event.rule.expr,
        channelId: channelId,
        webhook: "",
    });
    project.routes.push(route);
}

// Remove an event route from the given project
function removeRoute(project: models.ProjectInfo, channelId: string, eventName: string) {
    // look up event info in the events array
    let event = drillplan.events.find((element) => {
        return element.name === eventName;
    });

    if (!event) {
        logger.Info("Unknown event requested: " + eventName);
        return;
    }

    // Get route index (addRoute ensures that each event type is only subscribed to once)
    var index = project.routes.findIndex((r) => {
            return r.channelId === channelId && r.expr === event.rule.expr;
        });
    // Remove route if found
    if (index >= 0) {
        project.routes.splice(index, 1)         // remove 1 item at the specified index
    }
}


// Add notification types for the given channel
// Also updates channel address
async function addNotifications(projectId: string, channelId: string, botaddress: botbuilder.IAddress, notifications: string[]) {
    let project = await jibe.getProject(projectId);
    if (!project) {
        return Promise.reject("Project " + projectId + " not found");
    }

    // Add routes
    for (let n of notifications) {
        addRoute(project, channelId, n);
    }

    // Update channel info
    addChannel(project, channelId, botaddress);

    return jibe.upsertProject(project);
}


// Unsubscribe from the provided list of event names
async function unsubscribe(projectId: string, channelId: string, notifications: string[]) {
    let project = await jibe.getProject(projectId);
    if (!project) {
        return Promise.reject("Project " + projectId + " not found");
    }

    // Remove specified routes
    for (let n of notifications) {
        removeRoute(project, channelId, n);
    }

    return jibe.upsertProject(project);
}

// Retrieve a drillplan event based on its regex
function getEventByRegex(expr: string) {
    return drillplan.events.find((event) => {
        return event.rule.expr === expr;
    });
}

// Retrieve the names of the events that are routed to the specified channel
function extractChannelSubscriptions(project: models.ProjectInfo, channelId: string): string[] {
    let subs = project.routes.filter((route) => {
            return route.channelId && route.channelId === channelId;
        }).map((route) => {
            let event = getEventByRegex(route.expr);
            if (!event) {
                logger.Info("Unable to find event with regex " + route.expr);
                return "";
            }
            return event.name;
        });
    return subs;
}

// get all subscriptions for the given channel
async function getSubscriptions(channelId: string): Promise<Subscription[]> {

    // fetch projects
    let projects = await jibe.getProjectList();

    // Generate subscription list for this channel
    let subscriptions = projects.map((p) => {
        let sub = new Subscription();
        sub.project = p.name;

        // retrieve routes to the specified channel
        sub.events = extractChannelSubscriptions(p, channelId);
        return sub;
    })

    return subscriptions;
}

// Retrieve list of subscriptions for a single project
async function getProjectSubscriptions(channelId: string, projectId: string): Promise<string[]> {
    let project = await jibe.getProject(projectId);
    return extractChannelSubscriptions(project, channelId);
}

// Retrieves the projectId of the project with the given name
// Returns an empty string if project not found
// TODO: Replace with query, this is absurdly inefficient
async function getProjectId(projectName: string) {
    let projects = await jibe.getProjectList();
    let proj = projects.find((p) => {
        return p.name === projectName;
    });
    if (proj) {
        return proj.id;
    } else {
        logger.Info("projectId not found for project " + projectName);
        return "";
    }
}


export {
    addNotifications,
    unsubscribe,
    getSubscriptions,
    getProjectSubscriptions,
    getProjectId,

    // Subscription info class
    Subscription
};
