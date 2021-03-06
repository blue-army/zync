'use strict';

import * as cosmos from 'documentdb';
import * as express from 'express';
var docdb = require('documentdb');
var UriFactory = docdb.UriFactory;

function read_project(req: express.Request, res: express.Response) {

    var db_key = process.env.db_key;

    let client = new cosmos.DocumentClient('https://zync.documents.azure.com:443/', { masterKey: db_key });
    var uri = UriFactory.createDocumentUri('jibe', 'projects', req.params['id']);
    client.readDocument(uri, function (_err, doc) {
        res.json(doc);
    });
};

function delete_project(req: any, res: any) {
    var db_key = process.env.db_key;

    let client = new cosmos.DocumentClient('https://zync.documents.azure.com:443/', { masterKey: db_key });
    var uri = UriFactory.createDocumentUri('jibe', 'projects', req.params['id']);
    client.deleteDocument(uri, function (_err, _doc) {
        res.json({});
    });
};

export {
    read_project as get,
    delete_project as delete,
}