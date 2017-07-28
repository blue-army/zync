import * as models from "../../models/models";
import * as uuid from "uuid";
import * as _ from 'lodash';
import * as cosmos from 'documentdb';
import * as rp from 'request-promise';
import * as express from 'express';
import * as bot from "../../bot/bot"

var docdb = require('documentdb');
var UriFactory = docdb.UriFactory;

function list_events(_req: express.Request, res: express.Response) {
    var db_key = process.env.db_key;

    let client = new cosmos.DocumentClient('https://zync.documents.azure.com:443/', { masterKey: db_key });
    var collLink = UriFactory.createDocumentCollectionUri('jibe', 'events');

    var items: any = [];
    client.readDocuments(collLink).toArray(function (err: any, docs: any) {

        if (err) {
            return handleError(err, res);
        }

        console.log(docs.length + ' Documents found');
        for (let doc of docs) {
            let p = models.EventInfo.fromObj(doc);
            items.push(p);
        }

        res.json(items);

    });
}

async function upsert_event(req: express.Request, res: express.Response) {

    let db_key = process.env.db_key;

    let payload = req.body;

    // id
    payload['id'] = _.get<Object, string>(payload, 'id', uuid.v4());
    let info = models.EventInfo.fromObj(payload);

    // insert document
    let client = new cosmos.DocumentClient('https://zync.documents.azure.com:443/', { masterKey: db_key });
    var doc_uri = UriFactory.createDocumentCollectionUri('jibe', 'events');
    client.upsertDocument(doc_uri, info, { disableAutomaticIdGeneration: true }, function (err: any, obj: any, _headers: any) {

        if (err) {
            return handleError(err, res);
        }

        // process it
        routeEvent(info)
            .then(() => {
                // convert to message
                info = models.EventInfo.fromObj(obj);
                res.json(info);
                return;
            })
            .catch(_err => {
                res.status(404).send('Something broke!');
                return;
            });
    });
}

async function routeEvent(event_info: models.EventInfo) {

    // setup payload
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
                    bot.sendCard(JSON.parse(c.botaddress), o);
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

    let card = new models.TeamsMessageCard();

    switch (info.type) {
        case 'slb.drill-plan.activity':
            let activityInfo = models.ActivityInfo.fromObj(info.content);
            let details = activityInfo.activity;

            let ancestorPath = details.getAncestorPath();
            card.sections.push(
                models.SectionInfo.CreateActivityCard(
                    details.getEntityImageUrl(),
                    details.entity_name,
                    models.ActivityDetails.getActivitySubtitle1(ancestorPath),
                    models.ActivityDetails.getActivitySubtitle2(ancestorPath),
                    false));

            card.sections.push(
                models.SectionInfo.CreateActivityCard(
                    activityInfo.owner.image_url,
                    details.getExpectedAction(),
                    activityInfo.owner.full_name,
                    details.comments,
                    true));

            card.actions.push(new models.ActionInfo("Launch Application", details.getEntityUrl()));

            break;
        case 'wazzap':
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