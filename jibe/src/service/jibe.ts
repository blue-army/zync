import * as models from "../models/models";
import * as cosmos from 'documentdb';
var docdb = require('documentdb');
var UriFactory = docdb.UriFactory;

// create db client
var db_key = process.env.db_key;
var client = new cosmos.DocumentClient('https://zync.documents.azure.com:443/', { masterKey: db_key });


// *** PROJECT INFO RETRIEVAL FUNCTIONS ***
// Retrieve list of all projects
function getProjectList(): Promise<[models.ProjectInfo]> {

    return new Promise<[models.ProjectInfo]>((resolve, reject) => {
        var collLink = UriFactory.createDocumentCollectionUri('jibe', 'projects');
        var projects: any = [];
        client.readDocuments(collLink).toArray(function (err: any, docs: any) {

            if (err) {
                console.log("error retrieving projects: ", err)
                reject(err);
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
function getProject(project_id: string): Promise<models.ProjectInfo> {

    return new Promise<models.ProjectInfo>((resolve, reject) => {
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

// Update/insert a project
function upsertProject(project_info: models.ProjectInfo): Promise<models.ProjectInfo> {

    return new Promise<models.ProjectInfo>((resolve, reject) => {
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


// *** APP INFO RETRIEVAL FUNCTIONS ***
// Retrieve a list of all registered apps
function getAppList(): Promise<[models.AppInfo]> {

    return new Promise<[models.AppInfo]>((resolve, reject) => {
        var collLink = UriFactory.createDocumentCollectionUri('jibe', 'apps');
        var apps: any = [];
        client.readDocuments(collLink).toArray(function (err: any, docs: any) {

            if (err) {
                reject(err);
                return;
            }

            for (let doc of docs) {
                let app = models.AppInfo.fromObj(doc);
                apps.push(app);
            }

            resolve(apps);
        });
    });
}

// Retrieve an individual app, specified by its ID
function getApp(app_id: string): Promise<models.AppInfo> {

    return new Promise<models.AppInfo>((resolve, reject) => {
        var uri = UriFactory.createDocumentUri('jibe', 'apps', app_id);
        client.readDocument(uri, function (err, doc) {

            if (err) {
                reject(err);
                return;
            }

            let app = models.AppInfo.fromObj(doc);
            resolve(app);
        });
    });
}

// Update/insert an app
function upsertApp(app_info: models.AppInfo): Promise<models.AppInfo>{

    return new Promise<models.AppInfo>((resolve, reject) => {
        // insert document
        let doc_uri = UriFactory.createDocumentCollectionUri('jibe', 'apps');
        client.upsertDocument(doc_uri, app_info, { disableAutomaticIdGeneration: true }, function (err:any, obj:any, _headers:any) {
            
            if (err) {
                reject(err);
                return;
            }

            // convert to message
            app_info = models.AppInfo.fromObj(obj);
            resolve(app_info);
        });
    });
}


export {
    getProject,
    getProjectList,
    upsertProject,
    getApp,
    getAppList,
    upsertApp,
}