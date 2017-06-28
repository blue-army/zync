'use strict';

import * as auth_utils from "../utils/auth-utils";
import * as _ from 'lodash';
import * as express from 'express';

module.exports = async function validate(req: express.Request, res: express.Response, next: Function) {

    let token = _.get<string>(req, 'headers.token', undefined);

    if (!token || token.length === 0) {
        res.status(401);
        res.send('missing token');
        return;
    }

    auth_utils.validate(token)
        .then((what => {
            console.log(what);

            // get client
            auth_utils.getAppInfo(what)
                .then((info) => {
                    if (info === null) {
                        console.log('unable to verify app');
                    } else {
                        console.log(info);
                    }
                    next();
                });
        }))
        .catch(_err => {
            res.status(401);
            res.json(req.headers);
        });
};
