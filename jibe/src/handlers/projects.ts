'use strict';

import * as models from "../models/project";
var docdb = require('documentdb');
var DocDBClient = docdb.DocumentClient;
var UriFactory = docdb.UriFactory;

function get_projects(_req: any, res: any) {
    var db_key = process.env.db_key;

    var dbClient = new DocDBClient(
        'https://zync.documents.azure.com:443/', {
            masterKey: db_key
        }
    );

    var collLink = UriFactory.createDocumentCollectionUri('jibe', 'projects');

    var projects: any = [];
    dbClient.readDocuments(collLink).toArray(function (err: any, docs: any) {

        if (err) {
            return handleError(err, res);
        }

        console.log(docs.length + ' Documents found');

        for (let doc of docs) {
            let p = models.ProjectInfo.fromObj(doc);
            projects.push(p);
        }

        res.json(projects);

    });
}


function handleError(error: any, res: any) {
    console.log('\nAn error with code \'' + error.code + '\' has occurred:');
    console.log('\t' + JSON.parse(error.body).message);

    res.status(500);
    res.render('error');
}

export {
    get_projects as get,
}