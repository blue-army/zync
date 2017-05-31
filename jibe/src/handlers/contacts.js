'use strict';

var docdb = require('documentdb');
var DocDBClient = docdb.DocumentClient;
var UriFactory = docdb.UriFactory;

var repository = require('../lib/contactRepository');

module.exports = {
    get: function contacts_get(req, res) {

        var db_key = process.env.db_key;

        var docDbClient = new DocDBClient(
            'https://zync.documents.azure.com:443/', {
                masterKey: db_key
            }
        );

        var uri = UriFactory.createDocumentUri('jibe', 'projects', '7aff6973-64a0-9cce-d767-a4c01622d7ed');
        docDbClient.readDocument(uri, function (err, doc) {
            res.json(doc);
        });
    }
};