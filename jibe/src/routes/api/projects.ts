import * as models from "../../models/models";
import * as uuid from "uuid";
import * as lodash from 'lodash';
import * as jibe from '../../service/jibe'


// Respond with a list of all projects
function list_projects(_req: any, res: any) {
    jibe.getProjectList()
        .then((projects) => {
            res.json(projects);
        })
        .catch((err) => {
            handleError(err, res);
        })
}

// Update/insert a project
function upsert_project(req: any, res: any) {

    let payload = req.body;
    payload['id'] = lodash.get<Object, string>(payload, 'id', uuid.v4());
    let project_info = models.ProjectInfo.fromObj(payload);

    // insert document
    jibe.upsertProject(project_info)
        .then((upserted) => {
            res.json(upserted);
        })
        .catch((err) => {
            handleError(err, res)
        });
}

function handleError(error: any, res: any) {
    console.log('\nAn error with code \'' + error.code + '\' has occurred:');
    console.log('\t' + JSON.parse(error.body).message);
    res.status(500);
    res.json(error);
}

export {
    list_projects as get,
    upsert_project as put,
}