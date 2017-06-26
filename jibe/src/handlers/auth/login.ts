'use strict';

import * as auth_utils from "../../utils/auth-utils";
import * as models from "../../models/models";

module.exports = {
    post: async function login(req: any, res: any) {

        let payload = req.body;

        // id
        let info = models.LoginInfo.fromObj(payload);

        let token = "";
        try {
            token = await auth_utils.login(info.client_id, info.client_secret);
        } catch (error) {
        }

        res.json({
            token: token.accessToken,
        });
    }
};