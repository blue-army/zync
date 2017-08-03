import * as bot from '../../bot/bot'
import * as express from 'express';

var address = {  
   "id":"1501719090455",
   "channelId":"msteams",
   "user":{  
      "id":"29:1gXJQ5rTWQs2XzRYk4z3rW3VFFvYrcm7sHdHu8Efk09tCsNyg_NKvB-nLHcSUTmhgqEifdAQt7iyH0EbwFHONYA",
      "name":"Rebecca Bauer"
   },
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
    bot.sendActionableCard(address, req.body);
    res.status(200).send();
}

export {
    send_card as put,
}