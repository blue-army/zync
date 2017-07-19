'use strict';

import * as models from "../../../../models/models";
import * as _ from 'lodash';
import * as express from 'express';
const MicrosoftGraph = require('@microsoft/microsoft-graph-client');

// https://developer.microsoft.com/en-us/graph/docs/api-reference/beta/api/group_post_channels
// Scopes: Group.ReadWrite.All

// Function to retrieve channel list via the Microsoft Graph API
function list_channels(req: express.Request, res: express.Response) {
    let token = _.get<string>(req, 'headers.token', undefined);
    console.log("TOKEN: ", token)
    let graph_client = MicrosoftGraph.Client.init({
        authProvider: (done: any) => {
            if (token) {
                done(null, token); //first parameter takes an error if you can't get an access token
            } else {
                done("Error: User token required", null);
            }
        }
    });

    graph_client
        .api('groups/{group_id}/channels'.replace('{group_id}', req.params['id']))
        .version("beta") //optional, but recommeded to have before query params
        // .select("displayName")
        .get()
        .then((graph_res: any) => {
            // Filter out extraneous info
            console.log("Success!!!");
            let val = graph_res.value;
            for (let i in val) {
                val[i] = models.GraphChannelInfo.fromObj(val[i]);
            }
            res.json(val);
        }).catch((err: any) => {
            console.log("auth failure")
            res.send(err);
        });
};

// Function to create a channel via the Microsoft Graph API
function create_channel(req: express.Request, res: express.Response) {
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
        .post(req.body)
        .then((graph_res: any) => {
            // Filter out extraneous info
            let new_channel = models.GraphChannelInfo.fromObj(graph_res.body)
            res.json(new_channel);
        }).catch((err: any) => {
            res.send(err);
        });
};

export {
    list_channels as get,
    create_channel as post
}