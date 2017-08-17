import * as express from 'express';
import * as jibe from '../service/jibe';
import * as models from '../models/models';

function avatar(req: express.Request, res: express.Response) {

    // verify request
    if (req.body['token'] != 'LFAeYBPsS5rlo2WbYxCnxPyO') {
        return res.status(401).send("Unauthorized");
    }

    res.json({
        "response_type": "ephemeral",
        "attachments": [{
            "image_url": "https://jibe.azurewebsites.net/assets/images/activities/" + req.body["text"] + ".png",
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
    short: boolean;
}

async function listProjects(): Promise<SlackAttachment> {
    let projects: models.ProjectInfo[];
    try {
        projects = await jibe.getProjectList();
    } catch (e) {
        let msg = new SlackAttachment();
        msg.pretext = "Sorry, we could not retrieve the project list at this time.";
        return;
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
    let attachment = new SlackAttachment();
    attachment.pretext = "We found " + projects.length + " projects!";
    attachment.fallback = "Projects: " + projects.map((p) => {return p.name;}).join(', ');
    attachment.title = "Projects";
    attachment.title_link = "https://jibe.azurewebsites.net/my-projects";
    attachment.fields = fields;
    attachment.thumb_url = "https://jibe.azurewebsites.net/assets/images/gear.png";
    return attachment;
}

function help(): SlackAttachment {
    let attachment = new SlackAttachment();
    attachment.title = "Jibe Slash Commands";
    let commands = [
        "Projects: List all projects",
        "Help: Display a list of valid commands"
    ]
    attachment.text = " - " + commands.join("\n - ");
    return attachment;
}

async function jibeCommand(req: express.Request, res: express.Response) {
    console.log(req.body);
    // verify request
    if (req.body['token'] != 'nUpWah4iy7Wjoi4UwelRDlat') {
        return res.status(401).send("Unauthorized");
    }

    // Preprocess input text
    let input = req.body.text.toLowerCase();

    let slashMessage = new SlashMessage();
    let attachment;
    switch (input) {
        case "projects":
            attachment = await listProjects();
            break;
        case "help":
            attachment = help();
            break;
        default:
            slashMessage.text = "We weren't sure what you meant by " + req.body.text + ". Try one of these commands: ";
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