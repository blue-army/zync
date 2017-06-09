'use strict';

import * as models from "../../../models/models";
import * as uuid from "uuid";
import * as lodash from 'lodash';
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

    var uri = UriFactory.createDocumentUri('jibe', 'projects', req.params['id']);
    fetch_document(uri).
        then(doc => {
            let p = models.ProjectInfo.fromObj(doc);

            // setup payload
            let body = {};
            if (event_info.type === 'raw') {
                body = event_info.content;
            }

            let card = new models.PropertyChangedEventInfo();
            card.sections.push(models.SectionInfo.CreateActivityCard(false, "Mud Design Changed", "Density", "http://icons.iconarchive.com/icons/rokey/fantastic-dream/128/driver-mud-icon.png", ))
            card.sections.push(models.SectionInfo.CreateFactCard(true, new Map([["From", "0.1"], ["To", "0.5"]])));
            card.actions.push(new models.ActionInfo("Launch Application", "http://www.bing.com"));

            let o = card.ToObj();

            // fetch general channel
            for (let c of p.channels) {

                if (c.name === 'general') {
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

export {
    create_event as post,
}