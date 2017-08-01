import * as models from "../../models/models";
import * as cosmos from 'documentdb';
import * as drillplan from "../../plugins/drillplan"

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

    let msgInfo: models.MessageInfo;
    switch (info.type) {
        case 'slb.drill-plan.activity':
            msgInfo = drillplan.createMessageInfo(info);
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