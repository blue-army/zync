import * as express from 'express';

function avatar(_req: express.Request, res: express.Response) {
    res.json({
        "text": "iroh"
    })
}

function init(app: express.Application) {
    app.post('/api/slash/avatar', avatar);
}

export {
    init
}