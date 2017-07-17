import * as models from "../models/models";
import * as cosmos from 'documentdb';
var docdb = require('documentdb');
var UriFactory = docdb.UriFactory;

async function getProjectList(): Promise<[any]> {

    return new Promise<[any]>((resolve, reject) => {
        var db_key = process.env.db_key;

        let client = new cosmos.DocumentClient('https://zync.documents.azure.com:443/', { masterKey: db_key });
        var collLink = UriFactory.createDocumentCollectionUri('jibe', 'projects');

        var projects: any = [];
        client.readDocuments(collLink).toArray(function (err: any, docs: any) {

            if (err) {
                reject(new Error("error retrieving projects"));
            }

            for (let doc of docs) {
                let p = models.ProjectInfo.fromObj(doc);
                projects.push(p);
            }

            resolve(projects);
        });
    });
}

export {
    getProjectList,
}