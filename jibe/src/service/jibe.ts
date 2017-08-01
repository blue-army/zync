import * as models from "../models/models";
import * as cosmos from 'documentdb';
var docdb = require('documentdb');
var UriFactory = docdb.UriFactory;

var db_key = process.env.db_key;
var client = new cosmos.DocumentClient('https://zync.documents.azure.com:443/', { masterKey: db_key });


async function getProjectList(): Promise<[any]> {

    return new Promise<[any]>((resolve, reject) => {
        var collLink = UriFactory.createDocumentCollectionUri('jibe', 'projects');
        var projects: any = [];
        client.readDocuments(collLink).toArray(function (err: any, docs: any) {

            if (err) {
                console.log("error retrieving projects: ", err)
                reject(new Error("error retrieving projects"));
                return;
            }

            for (let doc of docs) {
                let p = models.ProjectInfo.fromObj(doc);
                projects.push(p);
            }

            resolve(projects);
        });
    });
}

// Retrieve an individual project, specified by project ID
async function getProject(project_id: string): Promise<any> {

    return new Promise<any>((resolve, reject) => {
        var uri = UriFactory.createDocumentUri('jibe', 'projects', project_id);
        client.readDocument(uri, function (err, doc) {
            if (err) {
                reject(err);
                return;
            }

            let project = models.ProjectInfo.fromObj(doc);
            resolve(project);
        });
    });
}

async function upsertProject(project_info: models.ProjectInfo): Promise<any> {

    return new Promise<any>((resolve, reject) => {
        // insert document
        var doc_uri = UriFactory.createDocumentCollectionUri('jibe', 'projects');
        client.upsertDocument(doc_uri, project_info, { disableAutomaticIdGeneration: true }, function (err:any, obj:any, _headers:any) {
            
            if (err) {
                reject(err);
                return;
            }

            // convert to message
            project_info = models.ProjectInfo.fromObj(obj);
            resolve(project_info);
        });
    });
}


export {
    getProject,
    getProjectList,
    upsertProject,
}