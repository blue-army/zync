import * as express from 'express';

module.exports = {
    get: async function info_get(_req: express.Request, res: express.Response) {
        res.json({
            status: 'ok',
        });
    }
};