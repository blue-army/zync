'use strict';

// import * as auth_utils from "../utils/auth-utils";

module.exports = {
    get: async function info_get(_req: any, res: any) {

        // let token = await auth_utils.getToken();

        res.json({
            status: 'ok',
            // token: token,
        });
    }
};