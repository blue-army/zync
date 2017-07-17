import * as models from "../../models/models";
import * as express from 'express';
import * as rp from 'request-promise';
import * as auth_utils from '../../utils/auth-utils';

async function list_groups(_req: express.Request, res: express.Response) {

    try {
        // get access token
        let token = await auth_utils.getToken();

        // create request
        var options = {
            method: 'GET',
            uri: "https://graph.microsoft.com/beta/groups?$filter=groupTypes/any(c:c+eq+'Unified')",
            headers: {
                'Authorization': 'Bearer ' + token,
            },
            json: true
        };

        // invoke
        let val = await rp(options);

        // Filter out extraneous info
        for (let i in val.value) {
            val.value[i] = models.GroupInfo.fromObj(val.value[i]);
        }
        res.send(val.value);

    } catch (error) {
        res.send(error);
    }
}

async function create_group(_req: express.Request, res: express.Response) {

    try {
        // get access token
        let token = await auth_utils.getToken();

        let payload = _req.body;
        let name = payload['name'];

        // create request
        let options = {
            method: 'POST',
            uri: "https://graph.microsoft.com/beta/groups",
            headers: {
                'Authorization': 'Bearer ' + token,
            },
            json: true,
            // Group body can hold other properties 
            // (https://developer.microsoft.com/en-us/graph/docs/api-reference/beta/resources/group)
            body: {
                description: "group.description",
                displayName: name,
                groupTypes: [
                    "Unified"
                ],
                mailEnabled: true,
                // Using same group name for mailNickname 
                mailNickname: name,
                securityEnabled: false,
            }
        };

        // invoke
        let val = await rp(options);

        res.send(val.value);
        
    } catch (error) {
        res.send(error);
    }
}

export {
    list_groups as get,
    create_group as put,
}
