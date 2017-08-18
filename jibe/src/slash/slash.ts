import * as express from 'express';
import * as jibe from '../service/jibe';
import * as models from '../models/models';
import * as _ from 'lodash';

let avatars = new Map<string, string>()
avatars.set('aang', 'Aang-64');
avatars.set('iroh', 'GeneralIroh-64');
avatars.set('tylee', 'TyLee-64');
avatars.set('toph', 'Toph-64');
avatars.set('meng', 'Meng-64');
avatars.set('suki', 'Suki-64');
avatars.set('unknown', 'Unknown-48');

function avatar(req: express.Request, res: express.Response) {

    // verify request
    if (req.body['token'] != 'LFAeYBPsS5rlo2WbYxCnxPyO') {
        return res.status(401).send("Unauthorized");
    }

    let text = _.get<string>(req.body, 'text', 'unknown').toLowerCase();
    let name = avatars.get(text)
    if (name === undefined) {
        name = "Unknown-48"
    }

    res.json({
        "response_type": "ephemeral",
        "attachments": [{
            "image_url": "https://jibe.azurewebsites.net/assets/images/avatars/" + name + ".png",
        }]
    })
}

class SlashMessage {
    response_type: string = "ephemeral";
    attachments: SlackAttachment[];
    text: string;
}

class SlackAttachment {
    fallback: string;
    color: string = "#0078D7";
    pretext: string;
    author_name: string;
    author_link: string;
    author_icon: string;
    title: string;
    title_link: string;
    text: string;
    fields: SlackAttachmentField[];
    image_url: string;
    thumb_url: string;
    footer: string = "Jibe";
    footer_icon: string = "https://jibe.azurewebsites.net/assets/connector/Taiji.png";
    ts: number | string = Date.now()/1000;
}

class SlackAttachmentField {
    title: string;
    value: string;
    short: boolean = false;
}

// Create a Slack attachment listing all current projects
async function listProjects(projects?: models.ProjectInfo[]): Promise<SlackAttachment> {
    let attachment = new SlackAttachment();
    // Retrieve projects from db if they were not passed in
    if (!projects) {
        try {
            projects = await jibe.getProjectList();
        } catch (e) {
            attachment.pretext = "Sorry, we could not retrieve the project list at this time.";
            return attachment;
        }
    }

    // Create fields displaying project info
    let fields = projects.map((project) => {
        let field = new SlackAttachmentField();
        field.title = project.name;
        field.value = "Source: " + project.source;
        field.short = true;
        return field;
    });

    // Create attachment
    attachment.pretext = "We found " + projects.length + " projects!";
    attachment.fallback = "Projects: " + projects.map((p) => {return p.name;}).join(', ');
    attachment.title = "Projects";
    attachment.title_link = "https://jibe.azurewebsites.net/my-projects";
    attachment.fields = fields;
    attachment.thumb_url = "https://jibe.azurewebsites.net/assets/images/gear.png";
    return attachment;
}

// Create a Slack attachment describing the given project
async function describeProject(projectName: string): Promise<SlackAttachment> {
    let attachment = new SlackAttachment();
    let projects: models.ProjectInfo[];
    try {
        projects = await jibe.getProjectList();
    } catch (e) {
        attachment.pretext = "Sorry, we could not retrieve the project list at this time.";
        return attachment;
    }

    // Return a usage help message if requested
    if (projectName === "help" || projectName === "") {
        return projectDescribeHelp(projects);
    }

    // Find requested project
    let project = projects.find((p) => {
        return p.name.toLowerCase() === projectName.toLowerCase();
    });

    // If the user requested a project that was not found, display the full list of projects
    if (!project) {
        attachment = await listProjects(projects);
        attachment.pretext = "We didn't find a project named '" + projectName + "'. This is the full list of projects: "
        return attachment;
    }

    // Create project info fields
    let idField = new SlackAttachmentField();
    idField.title = "Project ID";
    idField.value = project.id;

    let sourceField = new SlackAttachmentField();
    sourceField.title = "Source";
    sourceField.value = project.source;
    sourceField.short = true;

    let geoField = new SlackAttachmentField();
    geoField.title = "GeoHash";
    geoField.value = project.geohash;
    geoField.short = true;

    // Create project description attachment
    attachment.fallback = projectName;
    attachment.title = "Project " + projectName;
    attachment.title_link = "https://jibe.azurewebsites.net/my-projects";
    attachment.fields = [idField, sourceField, geoField];
    attachment.thumb_url = "https://jibe.azurewebsites.net/assets/images/gear.png";
    return attachment;
}

// *** HELP MESSAGES ***
// Default help message
function help(): SlackAttachment {
    let attachment = new SlackAttachment();
    attachment.title = "Jibe Slash Commands";

    // Summarize project-related commands
    let projectsCommands = new SlackAttachmentField();
    projectsCommands.title = "Project Commands";
    projectsCommands.value = [
        "Usage: /jibe projects <command>",
        "command: list | describe | help"
    ].join('\n');
    
    attachment.fields = [projectsCommands]
    return attachment;
}

// Help message for 'projects' command
function projectsHelp(): SlackAttachment {
    let attachment = new SlackAttachment();
    attachment.title = "Project Commands";
    let lines = [
        "Usage: /jibe projects <command>",
        "command: list | describe",
        " - list: list all projects",
        " - describe: describe a specific project"
    ];
    attachment.text = lines.join("\n");
    return attachment;
}

// Help message for 'projects describe' command
function projectDescribeHelp(projects: models.ProjectInfo[]): SlackAttachment {
    let attachment = new SlackAttachment();
    let projectNames = projects.map((p) => {
        return p.name;
    })
    attachment.title = "Project Description Command";
    let lines = [
        "Usage: /jibe projects describe <project-name>",
        "project-name options: " + (projectNames.length > 0 ? projectNames.join(', ') : "No projects at this time.")
    ]
    attachment.text = lines.join("\n");
    return attachment;
}

// *** ROUTING ***
// Handle routing for 'projects' command
async function projectCommand(commands: string[]): Promise<SlackAttachment> {
    let attachment: SlackAttachment;
    switch (commands[0]) {
        case "ls":
        case "list":
            attachment = await listProjects();
            break;

        case "":
        case "commands":
        case "help":
            attachment = projectsHelp();
            break;

        case "describe":
            attachment = await describeProject(commands[1]);
            break;

        default:
            attachment = projectsHelp();
            attachment.pretext = "We weren't sure what you meant by '" + commands[0] + "'. Try one of these project commands: ";
    }
    return attachment;
}

// Handle routing for all jibe slash-commands
async function jibeCommand(req: express.Request, res: express.Response) {
    console.log(req.body);
    // verify request
    if (req.body['token'] != 'nUpWah4iy7Wjoi4UwelRDlat') {
        return res.status(401).send("Unauthorized");
    }

    // Preprocess input text
    let input = req.body.text.toLowerCase();
    let commands = input.split(' ');
    for (let i = 0; i < 3; i++) {
        if (!commands[i]) {
            commands[i] = "";
        }
    }

    let slashMessage = new SlashMessage();
    let attachment;
    switch (commands[0].toLowerCase()) {
        case "project":
        case "projects":
            attachment = await projectCommand(commands.slice(1));
            break;
        case "commands":
        case "":
        case "help":
            attachment = help();
            break;
        default:
            slashMessage.text = "We weren't sure what you meant by '" + commands[0] + "'. Try one of these commands: ";
            attachment = help();
    }

    slashMessage.attachments = [attachment];
    res.json(slashMessage);
}

function init(app: express.Application) {
    app.post('/api/slash/avatar', avatar);
    app.post('/api/slash/jibe', jibeCommand);
}

export {
    init
}