import * as models from "../models/models";
import * as jibe from '../service/jibe';
import * as logger from '../service/logger';
import * as drillplan from "../plugins/drillplan"


// Add a channel to the given ProjectInfo object
function addChannel(project: models.ProjectInfo, channelId: string, botaddress: string) {
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
function addRoute(project: models.ProjectInfo, channelId: string, notification: string) {
    // look up event info in the events array
    let event = drillplan.events.find((element) => {
        return element.name === notification;
    });

    if (!event) {
        console.log("Unknown event requested:", notification);
        return;
    }

    // Check that the channel is not already subscribed to this event
    var match = project.routes.findIndex((r) => {
            return r.channelId === channelId && r.expr === event.rule.expr;
        });
    if (match >= 0) {
        console.log("Channel " + channelId + " is already subscribed to " + notification + " events.")
        return;
    }

    // Create new route and add to project
    let route = models.RouteInfo.fromObj({
        path: event.rule.path,
        expr: event.rule.expr,
        channel: "",
        channelId: channelId,
        webhook: "",
    });
    project.routes.push(route);
}

// Register a conversation in the given channel, and store the relevant bot address in our db
async function register(projectId: string, channelId: string, botaddress: string) {
    jibe.getProject(projectId)
        .then((project) => {
            // add the channel
            addChannel(project, channelId, botaddress);
            
            // Update project in db
            jibe.upsertProject(project).then((project_info) => {
                console.log("Project upserted!", project_info);
            }).catch((err) => {
                console.log("Upsertion error during conversation registration: ", err);
            });
        })
        .catch((err) => {
            console.log("Error registering conversation in conversation.ts", err);
        });
}


// Add notification types for the given channel
// Also updates channel address
async function addNotifications(projectId: string, channelId: string, botaddress: string, notifications: string[]) {
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

// Interface for object holding subscription information
interface ISubscription {
    project: string;
    events: string[];
}

class Subscription {
    project: string;        // Jibe project name
    events: string[];       // events that the given channel is subscribed to.
}

// Return a drillplan event based on its regex
function getEventByRegex(expr: string) {
    return drillplan.events.find((event) => {
        return event.rule.expr === expr;
    });
}

// get subscription info for the given channel
async function getSubscriptions(channelId: string): Promise<Subscription[]> {

    // fetch projects
    let projects = await jibe.getProjectList();

    // Generate subscription list for this channel
    let subscriptions = projects.map((p) => {
        let sub = new Subscription();
        sub.project = p.name;

        // retrieve routes to the specified channel
        sub.events = p.routes.filter((route) => {
            return route.channelId && route.channelId === channelId;
        }).map((route) => {
            let event = getEventByRegex(route.expr);
            if (!event) {
                logger.Info("Unable to find event with regex " + route.expr);
                return "";
            }
            return event.name;
        });
        return sub;
    })

    return subscriptions;
}


// Retrieves the projectId of the project with the given name
// Returns an empty string if project not found
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
    addNotifications as addNotifications,
    register as register,
    getSubscriptions as getSubscriptions,
    getProjectId as getProjectId,

    // Interfaces
    ISubscription as ISubscription
};
