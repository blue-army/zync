'use strict';

import * as auth_utils from "../../../utils/auth-utils";
import * as models from "../../../models/models";
import * as express from 'express';

module.exports = {
    post: async function login(req: express.Request, res: express.Response) {

        // parse
        let creds = models.LoginInfo.fromObj(req.body);

        // login
        let token: auth_utils.Token;
        try {
            token = await auth_utils.login(creds.resource_id.length !== 0 ? creds.resource_id : auth_utils.id_resource, creds.client_id, creds.client_secret);
        } catch (error) {
            res.status(401).send('unauthorized');
            return;
        }

        res.status(200).json({
            token: token.accessToken,
        });
    }
};