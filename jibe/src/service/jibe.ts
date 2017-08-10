import * as models from "../models/models";
import * as logger from "../service/logger";
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
                logger.Info("Error retrieving project list: " + err);
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
                if (err.code === 404) {
                    resolve(null);
                    return;
                }
                logger.Info("Error retrieving project " + project_id + " from db: " + err);
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
        client.upsertDocument(doc_uri, project_info, { disableAutomaticIdGeneration: true }, function (err: any, obj: any, _headers: any) {
            if (err) {
                logger.Info("Error upserting project " + project_info.id + ": " + err);
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
                logger.Info("Error retrieving list of apps: " + err);
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
                logger.Info("Error retrieving app " + app_id + ": " + err);
                reject(err);
                return;
            }

            let app = models.AppInfo.fromObj(doc);
            resolve(app);
        });
    });
}

// Update/insert an app
function upsertApp(app_info: models.AppInfo): Promise<models.AppInfo> {

    return new Promise<models.AppInfo>((resolve, reject) => {
        // insert document
        let doc_uri = UriFactory.createDocumentCollectionUri('jibe', 'apps');
        client.upsertDocument(doc_uri, app_info, { disableAutomaticIdGeneration: true }, function (err: any, obj: any, _headers: any) {

            if (err) {
                logger.Info("Error upserting app " + app_info.id + ": " + err);
                reject(err);
                return;
            }

            // convert to message
            app_info = models.AppInfo.fromObj(obj);
            resolve(app_info);
        });
    });
}

// *** EVENT STORAGE FUNCTIONS ***
// Retrieve a list of all events in the db
function getEventList() {

    return new Promise<[models.EventInfo]>((resolve, reject) => {
        var collLink = UriFactory.createDocumentCollectionUri('jibe', 'events');
        var items: any = [];
        client.readDocuments(collLink).toArray(function (err: any, docs: any) {

            if (err) {
                logger.Info("Error retrieving event list: " + err);
                reject(err);
                return;
            }

            console.log(docs.length + ' Documents found');
            for (let doc of docs) {
                let p = models.EventInfo.fromObj(doc);
                items.push(p);
            }
            resolve(items);
        });
    });
}

// Update/insert an event
function upsertEvent(event: models.EventInfo) {

    return new Promise<models.EventInfo>((resolve, reject) => {
        // insert document
        let doc_uri = UriFactory.createDocumentCollectionUri('jibe', 'events');
        client.upsertDocument(doc_uri, event, { disableAutomaticIdGeneration: true }, function (err: any, obj: any, _headers: any) {

            if (err) {
                logger.Info("Error upserting event: " + err);
                reject(err);
                return;
            }

            // convert to message
            event = models.EventInfo.fromObj(obj);
            resolve(event);
        });
    });
}


export {
    // Project functions
    getProject,
    getProjectList,
    upsertProject,

    // App functions
    getApp,
    getAppList,
    upsertApp,

    // Event functions
    getEventList,
    upsertEvent
}