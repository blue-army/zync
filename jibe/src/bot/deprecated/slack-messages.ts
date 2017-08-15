import * as models from '../models/models'

function jibeEvent(messageInfo: models.MessageInfo) {

    let slackMessage = {
        "text": "",
        "attachments": [
            {
                "fallback": messageInfo.activityEntityType + ' Event: ' + messageInfo.entityName,
                "color": "0078D7",
                "pretext": "",
                "author_name": "",
                "author_link": "",
                "author_icon": "",
                "title": messageInfo.activityEntityType + ': ' + messageInfo.entityName,
                "title_link": messageInfo.actionUrl,
                "text": "",
                "fields": [
                    {
                        "title": messageInfo.subtitle1,
                        "value": messageInfo.subtitle2,
                        "short": false
                    },
                    {
                        "title": "Changed by " + messageInfo.ownerFullName,
                        "value": '"' + messageInfo.comments + '"',
                        "short": false
                    }
                ],
                "thumb_url": messageInfo.typeImageUrl,
                "footer": "Jibe",
                "footer_icon": "https://jibe.azurewebsites.net/assets/connector/Taiji.png",
                "ts": Math.floor(Date.now() / 1000)
            }
        ]
    }
    return slackMessage;

}

export {
    jibeEvent
}