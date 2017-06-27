'use strict';

module.exports = {
    get: async function info_get(_req: any, res: any) {

        res.json({
            status: 'ok',
        });
    }
};