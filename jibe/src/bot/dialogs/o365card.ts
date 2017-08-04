import * as jibeBot from '../bot';
import * as teams from 'botbuilder-teams';
import * as builder from 'botbuilder';
import * as actionableCard from '../actionableCards/selectEvents'


// Dialog for sending an o365card
function o365CardDialog(session: builder.Session) { 
  let card = actionableCard.createCard(session);
  var msg = new teams.TeamsMessage(session)
                .summary("A sample O365 actionable card")
                .attachments([card]);

  session.send(msg);
  session.endDialog();
}

// example for o365 connector actionable card
var o365CardActionHandler = function (event: builder.IEvent, query: teams.IO365ConnectorCardActionQuery, callback: (err: Error, result: any, statusCode: number) => void): void {
  let userName = event.address.user.name;
  let body = JSON.parse(query.body);
  let msg = new builder.Message()
            .address(event.address)
            .summary("Thanks for your input!")
            .textFormat("xml")
            .text(`<h2>Thanks, ${userName}!</h2><br/><h3>Your input action ID:</h3><br/><pre>${query.actionId}</pre><br/><h3>Your input body:</h3><br/><pre>${JSON.stringify(body, null, 2)}</pre>`);
  jibeBot.connector.send([msg.toMessage()], (err: Error, address?: builder.IAddress[]) => {

  });
  callback(null, null, 200);
}


export {
  o365CardDialog as dialog,
  o365CardActionHandler as cardActionHandler,
}