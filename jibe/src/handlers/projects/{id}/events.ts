'use strict';

import * as models from "../../../models/models";
import * as cosmos from 'documentdb';
import * as rp from 'request-promise';
var docdb = require('documentdb');
var UriFactory = docdb.UriFactory;

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

async function create_event(req: any, res: any) {

    let payload = req.body;
    let event_info = models.EventInfo.fromObj(payload);

    // fetch project information
    var uri = UriFactory.createDocumentUri('jibe', 'projects', req.params['id']);
    fetch_document(uri).
        then(doc => {
            let p = models.ProjectInfo.fromObj(doc);

            // setup payload
            let card = parse(event_info);

            let o = card.ToObj();

            // fetch appropriate channel
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
        })
        .then((info) => {
            console.log(info);
            res.json({});
        })
        .catch((err) => {
            res.status(500);
            res.json(err);
        });
}

function parse(info: models.EventInfo): models.PropertyChangedEventInfo {

    let card = new models.PropertyChangedEventInfo();
    // let content = info.content;

    switch (info.type) {
        case 'slb.drill-plan.activity':
            let dp_content = models.ActivityInfo.fromObj(info.content);

            let ancestorPath = dp_content.activity.getAncestorPath();
            card.sections.push(
                models.SectionInfo.CreateActivityCard(
                    dp_img_for_entity(dp_content.activity.activity_entity_type),
                    dp_content.activity.entity_name,
                    models.ActivityDetails.getActivitySubtitle1(ancestorPath),
                    models.ActivityDetails.getActivitySubtitle2(ancestorPath),
                    false));
            
            card.sections.push(
                models.SectionInfo.CreateActivityCard(
                    "",
                    dp_content.activity.getExpectedAction(),
                    dp_content.owner.full_name,
                    dp_content.activity.comments,
                    true));

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

function dp_img_for_entity(entity_type: string): string {

    switch (entity_type.toLowerCase()) {
        case 'define cement job':
            return 'https://cdn0.iconfinder.com/data/icons/construction-linear-black/2048/392_-_Cement_Bag-512.png';
    }

    return '';
}


export {
    create_event as post,
}