import * as express from 'express';
import * as rp from 'request-promise';
import * as auth_utils from '../../../utils/auth-utils';

async function delete_group(_req: express.Request, res: express.Response) {

    try {
        // get access token
        let token = await auth_utils.getToken();

        let id = _req.params['id'];

        // create request
        let options = {
            method: 'DELETE',
            uri: "https://graph.microsoft.com/v1.0/groups/" + id,
            headers: {
                'Authorization': 'Bearer ' + token,
            }
        };

        // invoke
        let val = await rp(options);
        
        res.send(val);
        
    } catch (error) {
        res.send(error);
    }
}

export {
    delete_group as delete
}
