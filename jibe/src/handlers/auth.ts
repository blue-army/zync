'use strict';

import * as auth_utils from "../utils/auth-utils";
import * as _ from 'lodash';
import * as express from 'express';

module.exports = async function validate(req: express.Request, res: express.Response, next: Function) {

    let token = _.get<string>(req, 'headers.token', undefined);
    if (token) {
        try {
            let what = await auth_utils.validate(token);
            if (what) {
                let info = await auth_utils.getAppInfo(what);
                let caller_info: auth_utils.ClientInfo = {
                    id: what.appid,
                    name: info.displayName,
                };
                console.log(caller_info);
                res.locals['x-caller'] = caller_info;
            }
        } catch (error) {
        }
    }

    next();
};
