import * as express from 'express';
var azure = require('azure-sb')


let connStr = decodeURIComponent(process.env.SERVICE_BUS_CONNECTION_STRING);

async function receiveMessage(queueName: string): Promise<any> {

    return new Promise<any>((resolve, reject) => {
        var sbService = azure.createServiceBusService(connStr);

        let options = {
            isPeekLock: false,
            timeoutIntervalInS: 1,
        }

        sbService.receiveQueueMessage(queueName, options, function (err, lockedMessage) {
            if (err) {
                if (err == 'No messages to receive') {
                    console.log('No messages');
                    resolve(null);
                } else {
                    reject(err);
                }
            } else {
                resolve(lockedMessage);
            }
        });
    });
}

// function processMessage(sbService, err, lockedMsg) {
//   if (err) {
//     console.log('Error on Rx: ', err);
//   } else {
//     console.log('Rx: ', lockedMsg);
//     sbService.deleteMessage(lockedMsg, function(err2) {
//       if (err2) {
//         console.log('Failed to delete message: ', err2);
//       } else {
//         console.log('Deleted message.');
//       }
//     })
//   }
// }

function sendMessage(queueName: string, message: string) {


    var sbService = azure.createServiceBusService(connStr);

    sbService.sendQueueMessage(queueName, message, function (err: any) {
        if (err) {
            console.log('Failed Tx: ', err);
        } else {
            console.log('Sent ' + message);
        }
    });
}


// if (!connStr) throw new Error('Must provide connection string');
// var queueName = 'sbqtest';

// console.log('Connecting to ' + connStr + ' queue ' + queueName);
// 
// sbService.createQueueIfNotExists(queueName, function (err) {
//   if (err) {
//    console.log('Failed to create queue: ', err);
//   } else {
//    setInterval(checkForMessages.bind(null, sbService, queueName, processMessage.bind(null, sbService)), 5000);
//    setInterval(sendMessages.bind(null, sbService, queueName), 15000);
//   }
// });

function yo(req: express.Request, res: express.Response) {

    sendMessage('jibe-q', JSON.stringify(req.body, null, "  "));
    res.json({
        "hey": "you"
    })
}

async function ma(req: express.Request, res: express.Response) {

    let msg = await receiveMessage('jibe-q');
    res.json({
        "msg": msg
    })
}

export {
    yo as put,
    ma as get,
}