'use strict';

var docdb = require('documentdb');
var DocDBClient = docdb.DocumentClient;
var UriFactory = docdb.UriFactory;

var repository = require('../lib/contactRepository');

module.exports = {
    get: function contacts_get(req, res) {

        var docDbClient = new DocDBClient(
            'https://zync.documents.azure.com:443/', {
                masterKey: 'iR5wKpk619PBuIUqu2b5Dec79sXGsHK1P9jdzvmO1m1YBYeS8spFcP9FscoySw7SvOzka1thg14WNMtgCuRitQ=='
            }
        );

        var uri = UriFactory.createDocumentUri('jibe', 'projects', '7aff6973-64a0-9cce-d767-a4c01622d7ed');
        docDbClient.readDocument(uri, function (err, doc) {
            res.json(doc);
        });
    }
};