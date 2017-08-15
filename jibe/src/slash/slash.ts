import * as express from 'express';

function avatar(_req: express.Request, res: express.Response) {
    res.json({
        "response_type": "ephemeral",
        "text": "iroh",
        "attachments": [{
            "fallback": "Iroh",
            "image_url": "http://files.softicons.com/download/culture-icons/avatar-minis-icons-by-joumana-medlej/png/64x64/General%20Iroh.png",
        }]
    })
}

function init(app: express.Application) {
    app.post('/api/slash/avatar', avatar);
}

export {
    init
}