'use strict';

import * as models from "../../models/models";
import * as cosmos from 'documentdb';
import * as pu from '../../utils/prop-utils';

var docdb = require('documentdb');
var UriFactory = docdb.UriFactory;

function list_messages(_req: any, res: any) {
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

            let msg = parse(p);
            items.push(msg);
        }

        res.json(items);
    });
}

function parse(info: models.EventInfo): models.MessageInfo {

    let msgInfo = new models.MessageInfo();
    // let content = info.content;

    switch (info.type) {
        case 'slb.drill-plan.activity':
            let activityInfo = models.ActivityInfo.fromObj(info.content);
            let details = activityInfo.activity;

            let ancestorPath = details.getAncestorPath();
            msgInfo.id = info.id;
            msgInfo.typeImageUrl = details.getEntityImageUrl();
            msgInfo.entityName = details.entity_name;
            msgInfo.subtitle1 = models.ActivityDetails.getActivitySubtitle1(ancestorPath);
            msgInfo.subtitle2 = models.ActivityDetails.getActivitySubtitle2(ancestorPath);
            msgInfo.actionType = details.getExpectedAction();
            msgInfo.userImageUrl = pu._str(activityInfo.owner.image_url, "/assets/images/activities/noimage.jpg");
            msgInfo.ownerFullName = activityInfo.owner.full_name;
            msgInfo.activityDate = details.activity_time;
            msgInfo.comments = details.comments;
            msgInfo.actionUrl = details.getEntityUrl();

            break;
        case 'wazzap':
            break;
        default:
            break;
    }

    return msgInfo;
}



function handleError(error: any, res: any) {
    console.log('\nAn error with code \'' + error.code + '\' has occurred:');
    console.log('\t' + JSON.parse(error.body).message);

    res.status(500);
    res.send('error');
}

export {
    list_messages as get,
}