import * as models from "../../models/models";
import * as jibe from "../../service/jibe"
import * as uuid from "uuid";
import * as _ from 'lodash';
import * as cosmos from 'documentdb';
import * as rp from 'request-promise';
import * as express from 'express';
import * as bot from "../../bot/bot"
import * as drillplan from "../../plugins/drillplan"

var docdb = require('documentdb');
var UriFactory = docdb.UriFactory;

// handles GET requests
function list_events(_req: express.Request, res: express.Response) {
    // retrieve events from db
    jibe.getEventList()
        .then(events => {
            res.json(events);
        })
        .catch((err) => {
            handleError(err, res);
        });
}  

// handles PUT requests
async function upsert_event(req: express.Request, res: express.Response) {

    // Check that request has been authenticated
    if (!res.locals['x-caller']) {
        res.status(401).send("Unauthorized request");
        return;
    }

    let payload = req.body;

    // generate id if not provided
    payload['id'] = _.get<Object, string>(payload, 'id', uuid.v4());
    let info = models.EventInfo.fromObj(payload);

    // Check for presence of required properites
    var required = ['type', 'project', 'content'];
    for (let prop of required) {
        if (!info[prop]) {
            res.status(400).send({Error: "Missing required property '{{prop}}'".replace('{{prop}}', prop)});
            return;
        }
    }

    // add event to db
    jibe.upsertEvent(info)
        .then((event) => {
            info = event;
            return routeEvent(event);   // send event to subscribers
        })
        .catch((err) => {
            res.status(400).send({Error: "Unable to insert event into database"});
        })
        .then(() => {
            // routing successful - reply with the upserted event
            res.json(info);
        })
        .catch((err) => {
            res.status(400).send({Error: "Unable to send event for one or more routes"});
        });
}

async function routeEvent(event_info: models.EventInfo) {

    // set up payload
    let card = parse(event_info);
    let o = card.ToObj();

    // fetch project information
    var uri = UriFactory.createDocumentUri('jibe', 'projects', event_info.project);
    let doc = await fetch_document(uri);
    let proj = models.ProjectInfo.fromObj(doc);

    // get the route that matches the event
    var routes = getCardRoutes(proj, event_info);

    var promises = []
    var options = {
        method: 'POST',
        uri: "",
        body: o,
        json: true
    };

    for (let route of routes) {
        // if the route has an associated webhook, send a message to it
        if (route.webhook) {
            options.uri = route.webhook;
            promises.push(rp(options));
        }

        // also look for a matching channel with a webhook or bot address
        if (route.channel || route.channelId) {
            for (let c of proj.channels) {
                if (route.channel && c.name === route.channel) {
                    options.uri = c.webhook;
                    promises.push(rp(options));
                }
                if (route.channelId && c.id === route.channelId) {
                    bot.sendActionableCard(JSON.parse(c.botaddress), o);
                }
            }
        }
    }

    return Promise.all(promises);
}

// Return all project routes that match the event
function getCardRoutes(proj: models.ProjectInfo, eventInfo: models.EventInfo): models.RouteInfo[] {
    return proj.routes.filter(function(r) {
        let rexp = new RegExp(r.expr);
        let data = _.get(eventInfo.content, r.path, undefined);
        return (data && rexp.test(data));
    });
}

async function fetch_document(uri: string): Promise<any> {

    var db_key = process.env.db_key;
    return new Promise((resolve, reject) => {
        let client = new cosmos.DocumentClient('https://zync.documents.azure.com:443/', { masterKey: db_key });
        client.readDocument(uri, function (err, doc) {

            if (err) {
                return reject(err);
            }

            return resolve(doc);
        });
    });
}

function parse(info: models.EventInfo): models.TeamsMessageCard {

    let card: models.TeamsMessageCard;

    switch (info.type) {
        case 'slb.drill-plan.activity':
            card = drillplan.createTeamsMessageCard(info)
            break;
        case 'wazzap':
            card = new models.TeamsMessageCard();
            let w_content = models.EntityChangedEventInfo.fromObj(info.content);
            card.sections.push(
                models.SectionInfo.CreateActivityCard(
                    w_content.entity,
                    w_content.property,
                    "",
                    "http://icons.iconarchive.com/icons/rokey/fantastic-dream/128/driver-mud-icon.png",
                    false));
            card.sections.push(models.SectionInfo.CreateFactCard(true, new Map([["From", w_content.from], ["To", w_content.to]])));
            card.actions.push(new models.ActionInfo("Launch Application", "http://www.bing.com"));
            break;
        default:
            break;
    }

    return card;
}

function handleError(error: any, res: any) {
    console.log('\nAn error with code \'' + error.code + '\' has occurred:');
    console.log('\t' + JSON.parse(error.body).message);

    res.status(500);
    res.send('error');
}

export {
    list_events as get,
    upsert_event as put,
}