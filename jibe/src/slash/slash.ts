import * as express from 'express';

function avatar(req: express.Request, res: express.Response) {

    // verify request
    if (req.body['token'] != 'LFAeYBPsS5rlo2WbYxCnxPyO') {
        return res.send(404);
    }

    res.json({
        "response_type": "ephemeral",
        "text": "iroh",
        "attachments": [{
            "fallback": "Iroh",
            "image_url": "https://jibe.azurewebsites.net/assets/images/activities/" + req.body["text"] + ".png",
        }]
    })
}

function init(app: express.Application) {
    app.post('/api/slash/avatar', avatar);
}

export {
    init
}