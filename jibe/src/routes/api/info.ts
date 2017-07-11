import * as express from 'express';
import * as _ from 'lodash';

module.exports = {
    get: async function info_get(_req: express.Request, res: express.Response) {
        res.json({
            status: 'ok',
            caller: _.get(res.locals, 'x-caller', {}),
        });
    }
}; 
