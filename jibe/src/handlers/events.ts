'use strict';

import * as models from "../models/models";
import * as uuid from "uuid";
import * as lodash from 'lodash';
import * as cosmos from 'documentdb';
import * as rp from 'request-promise';

var docdb = require('documentdb');
var UriFactory = docdb.UriFactory;

function list_events(_req: any, res: any) {
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

async function upsert_event(req: any, res: any) {

    var db_key = process.env.db_key;

    let payload = req.body;

    // id
    payload['id'] = lodash.get<Object, string>(payload, 'id', uuid.v4());
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

    // get project
    let projectId = event_info.project;

    // fetch project information
    var uri = UriFactory.createDocumentUri('jibe', 'projects', projectId);
    let doc = await fetch_document(uri);
    let p = models.ProjectInfo.fromObj(doc);

    // setup payload
    let card = parse(event_info);
    let o = card.ToObj();

    // get appropriate channel
    for (let c of p.channels) {
        if (c.name === 'jibe') {
            var options = {
                method: 'POST',
                uri: c.webhook,
                body: o,
                json: true
            };

            return rp(options);
        }
    }
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

function parse(info: models.EventInfo): models.PropertyChangedEventInfo {

    let card = new models.PropertyChangedEventInfo();
    // let content = info.content;

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
    upsert_event as post,
}