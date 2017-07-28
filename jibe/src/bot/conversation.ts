import * as models from "../models/models";
import * as jibe from '../service/jibe';

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


// Register a conversation in the given channel, and store the relevant bot address in our db
async function register(projectId: string, channelId: string, botaddress: string) {
    jibe.getProject(projectId)
        .then((project) => {
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
async function addNotifications(projectId: string, channelId: string, notifications: string[]) {

    jibe.getProject(projectId)
        .then((project) => {
            for (let n of notifications) {
                // look up event info in the events array
                let event = events.find((element) => {
                    return element.name === n;
                });

                if (!event) {
                    console.log("Unknown event requested:", n);
                    continue;
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

            // Update project in db
            jibe.upsertProject(project).then((project_info) => {
                console.log("Project upserted!", project_info);
            }).catch((err) => {
                console.log("Upsertion error while adding routes: ", err);
            });
        })
        .catch((err) => {
            console.log("Error adding routes to project in conversation.ts", err);
        });
    
}


// get a map of project names to lists of route expressions for routes that the given channel is subscribed to.
async function getSubscriptions(channelId: string) {

    // fetch projects
    let projects = await jibe.getProjectList();
    var subscriptions = {};

    for (let p of projects) {
        var subs = [];
        subscriptions[p.name] = p.routes.filter((route) => {
            return route.channelId && route.channelId === channelId;
        }).map((route) => {
            return route.expr;
        });
    }
    return subscriptions;
}

async function getProjectId(projectName: string) {
    let projects = await jibe.getProjectList();
    let proj = projects.find((p) => {
        return p.name === projectName;
    });
    if (proj) {
        return proj.id;
    } else {
        console.log("Error: projectId not found.")
    }
}


export {
    addNotifications as addNotifications,
    register as register,
    getSubscriptions as getSubscriptions,
    getProjectId as getProjectId
};
