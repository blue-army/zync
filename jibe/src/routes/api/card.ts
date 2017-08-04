import * as bot from '../../bot/bot'
import * as express from 'express';

var default_address = {  
   "id":"1501719090455",     // not required - should we save anyway?
   "channelId":"msteams",
   "conversation":{  
      "isGroup":true,
      "id":"19:68b83f2c7ffd4b36bbbca0f16a4a097d@thread.skype"
   },
   "bot":{  
      "id":"28:bababc50-4dad-45b5-a10f-5b98129ccf1d",
      "name":"Jibe"
   },
   "serviceUrl":"https://smba.trafficmanager.net/amer-client-ss.msg/"
}

function send_card(req: express.Request, res: express.Response) {
    let address = req.body.address;
    let card = req.body.card;
    if (!address) {
        address = default_address;
        // If no address and no card parameter, try sending the whole request body as a card
        if (!card) {
            card = req.body;
        }
    }
    bot.sendActionableCard(address, card);
    res.status(200).send();
}

export {
    send_card as put,
}