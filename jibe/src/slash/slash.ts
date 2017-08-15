import * as express from 'express';

function avatar(req: express.Request, res: express.Response) {

    console.log(req.body);
    
    res.json({
        "response_type": "ephemeral",
        "text": "iroh",
        "attachments": [{
            "fallback": "Iroh",
            "image_url": "https://jibe.azurewebsites.net/assets/images/activities/" + "bha_drilling_string_1.png",
        }]
    })
}

function init(app: express.Application) {
    app.post('/api/slash/avatar', avatar);
}

export {
    init
}