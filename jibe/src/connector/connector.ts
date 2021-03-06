// const utils = require('../utils/utils.js');
// const faker = require('faker');
import * as express from 'express';
import * as models from "../models/models";
import * as jibe from '../service/jibe';
import * as bot from '../bot/bot';
import * as botUtils from '../bot/bot-utils'
import * as drillplan from '../plugins/drillplan';

// connector setup flow
async function setup(_req: express.Request, res: express.Response, _next: express.NextFunction) {

    var connectorAppID: string = process.env.CONNECTOR_APP_ID || "56444edc-a5c9-4991-9e3c-5cf928c29867"; // "bc32fa91-81d0-4314-9914-e718d47e90e8";
    var baseURI: string = process.env.BASE_URI || "https://jibe.azurewebsites.net";

    // fetch projects
    let projects = await jibe.getProjectList();

    res.render('setup.pug', {
        title: 'Setup Connector',
        registerUrl: 'https://outlook.office.com/connectors/Connect?app_id=' + connectorAppID + '&callback_url=' + baseURI + '/connector/register',
        projects: projects,
        events: drillplan.events,
    });
}

//	connector registration flow
async function register(req: express.Request, res: express.Response) {

    // TODO: ensure that this is a valid callback

    // Parse register message from connector, find the group name and webhook url
    var query = req.query;
    var webhook_url = query.webhook_url;
    var group_name = query.group_name;
    var appType = query.app_type;
    var state = decodeURIComponent(query.state);

    // extract variables from state
    var notifs: string[] = [];
    var projectId = "";
    for (let s of state.split('&')) {
        let segments = s.split('=');
        let prop = segments[0];
        let val = segments[1];
        if (prop === 'project') {
            projectId = val;
        } else if (prop === 'notification') {
            notifs.push(val);
        }
    }

    // add routes to project and update it
    jibe.getProject(projectId)
        .then((project) => {
            for (let n of notifs) {
                // look up event info in the events array
                let event = drillplan.events.find((element) => {
                    return element.name === n;
                });

                if (!event) {
                    console.log("Unknown event requested:", n);
                    continue;
                }

                let route = models.RouteInfo.fromObj({
                    path: event.rule.path,
                    expr: event.rule.expr,
                    webhook: webhook_url,
                    channelId: "",
                });
                
                project.routes.push(route);
            }
            jibe.upsertProject(project).then((project_info) => {
                console.log("Project upserted!", project_info);
            }).catch((err) => {
                console.log("Upsertion error", err);
            });
        })
        .catch((err) => {
            console.log(err);
        });
    
    res.render('connector.pug', {
        title: 'Connector Registered',
        appType: appType,
        groupName: group_name,
        state: state,
        webhookUrl: webhook_url,
    });
}

var default_address = {  
   "id":"1501719090455",
   "channelId":"msteams",
   "conversation":{  
      "isGroup":true,
      "id":"19:68b83f2c7ffd4b36bbbca0f16a4a097d@thread.skype"
   },
   "bot":{
      "id":"28:bababc50-4dad-45b5-a10f-5b98129ccf1d",
      "name":"DrillPlan"
   },
   "serviceUrl":"https://smba.trafficmanager.net/amer-client-ss.msg/"
}

function invoke(req: express.Request, res: express.Response) {
    let messages = [
        "Headers: " + botUtils.JsonToMarkdown(req.headers),
        "Body: " + botUtils.JsonToMarkdown(req.body),
        "Querystring: " + botUtils.JsonToMarkdown(req.query),
        "Params: " + botUtils.JsonToMarkdown(req.params),
    ]

    bot.sendMessage(default_address, messages.join('\n\n'));
    res.status(200).send();
}

function init(app: express.Application) {
    app.get('/connector/setup', setup);
    app.get('/connector/register', register);
    app.post('/connector/invoke', invoke);
    app.post('/api/connector/invoke', invoke);
    app.post('/api/connector/invoke/settings', invoke);
    return this;
}

export {
    init as init,
};
