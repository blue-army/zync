'use strict';

import * as models from "../../../../models/models";
import * as _ from 'lodash';
import * as express from 'express';
const MicrosoftGraph = require('@microsoft/microsoft-graph-client');

// Function to retrieve channel list via the Microsoft Graph API
function list_channels(req: express.Request, res: express.Response) {
    let token = _.get<string>(req, 'headers.token', undefined);

    let graph_client = MicrosoftGraph.Client.init({
        authProvider: (done: any) => {
            done(null, token); //first parameter takes an error if you can't get an access token
        }
    });

    graph_client
        .api('groups/{group_id}/channels'.replace('{group_id}', req.params['id']))
        .version("beta") //optional, but recommeded to have before query params
        // .select("displayName")
        .get()
        .then((graph_res: any) => {
            // Filter out extraneous info
            let val = graph_res.body.value;
            for (let i in val) {
                val[i] = models.GraphChannelInfo.fromObj(val[i]);
            }
            res.json(val);
        }).catch((err: any) => {
            res.send(err);
        });
};

export {
    list_channels as get,
}