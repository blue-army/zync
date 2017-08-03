import * as express from 'express';

function yo(_req: express.Request, res: express.Response) {
    res.json({
        "hey": "you"
    })
}

export {
    yo as put
}