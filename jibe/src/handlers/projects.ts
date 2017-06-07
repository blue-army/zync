'use strict';

import * as models from "../models/models";
import * as uuid from "uuid";
import * as lodash from 'lodash';
import * as cosmos from 'documentdb';
var docdb = require('documentdb');
var UriFactory = docdb.UriFactory;

function list_projects(_req: any, res: any) {
    var db_key = process.env.db_key;

    let client = new cosmos.DocumentClient('https://zync.documents.azure.com:443/', { masterKey: db_key });
    var collLink = UriFactory.createDocumentCollectionUri('jibe', 'projects');

    var projects: any = [];
    client.readDocuments(collLink).toArray(function (err: any, docs: any) {

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

function upsert_project(req: any, res: any) {

    var db_key = process.env.db_key;

    let payload = req.body;

    // id
    payload['id'] = lodash.get<Object, string>(payload, 'id', uuid.v4());
    let project_info = models.ProjectInfo.fromObj(payload);

    // insert document
    let client = new cosmos.DocumentClient('https://zync.documents.azure.com:443/', { masterKey: db_key });
    var doc_uri = UriFactory.createDocumentCollectionUri('jibe', 'projects');
    client.createDocument(doc_uri, project_info, { disableAutomaticIdGeneration: true }, function (err:any, obj:any, _headers:any) {
        
        if (err) {
            return handleError(err, res);
        }

        // convert to message
        project_info = models.ProjectInfo.fromObj(obj);
        res.json(project_info);
    });
}

function handleError(error: any, res: any) {
    console.log('\nAn error with code \'' + error.code + '\' has occurred:');
    console.log('\t' + JSON.parse(error.body).message);

    res.status(500);
    res.render('error');
}

export {
    list_projects as get,
    upsert_project as post,
}