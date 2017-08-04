import * as jibeBot from '../bot';
import * as teams from 'botbuilder-teams';
import * as builder from 'botbuilder';
import * as actionableCard from '../actionableCards/selectEvents'


function o365CardDialog(session: builder.Session) { 
  // multiple choice examples
  // let actionCard1 = new teams.O365ConnectorCardActionCard(session)
  //                 .id("card-1")
  //                 .name("Multiple Choice")
  //                 .inputs([
  //                   new teams.O365ConnectorCardMultichoiceInput(session)
  //                       .id("list-1")
  //                       .title("Pick multiple options")
  //                       .isMultiSelect(true)
  //                       .isRequired(true)
  //                       .style('expanded')
  //                       .choices([
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 1").value("1"),
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 2").value("2"),
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 3").value("3")
  //                       ]),
  //                   new teams.O365ConnectorCardMultichoiceInput(session)
  //                       .id("list-2")
  //                       .title("Pick multiple options")
  //                       .isMultiSelect(true)
  //                       .isRequired(true)
  //                       .style('compact')
  //                       .choices([
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 4").value("4"),
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 5").value("5"),
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 6").value("6")
  //                       ]),
  //                   new teams.O365ConnectorCardMultichoiceInput(session)
  //                       .id("list-3")
  //                       .title("Pick an options")
  //                       .isMultiSelect(false)
  //                       .style('expanded')
  //                       .choices([
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice a").value("a"),
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice b").value("b"),
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice c").value("c")
  //                       ]),
  //                   new teams.O365ConnectorCardMultichoiceInput(session)
  //                       .id("list-4")
  //                       .title("Pick an options")
  //                       .isMultiSelect(false)
  //                       .style('compact')
  //                       .choices([
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice x").value("x"),
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice y").value("y"),
  //                         new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice z").value("z")
  //                       ])
  //                 ])
  //                 .actions([
  //                   new teams.O365ConnectorCardHttpPOST(session)
  //                   .id("card-1-btn-1")
  //                   .name("Send")
  //                   .body(JSON.stringify({
  //                     list1: '{{list-1.value}}',
  //                     list2: '{{list-2.value}}',
  //                     list3: '{{list-3.value}}',
  //                     list4: '{{list-4.value}}'}))
  //                 ]);
  
  // // text input examples
  // let actionCard2 = new teams.O365ConnectorCardActionCard(session)
  //                 .id("card-2")
  //                 .name("Text Input")
  //                 .inputs([
  //                   new teams.O365ConnectorCardTextInput(session)
  //                       .id("text-1")
  //                       .title("multiline, no maxLength")
  //                       .isMultiline(true),
  //                   new teams.O365ConnectorCardTextInput(session)
  //                       .id("text-2")
  //                       .title("single line, no maxLength")
  //                       .isMultiline(false),
  //                   new teams.O365ConnectorCardTextInput(session)
  //                       .id("text-3")
  //                       .title("multiline, max len = 10, isRequired")
  //                       .isMultiline(true)
  //                       .isRequired(true)
  //                       .maxLength(10),
  //                   new teams.O365ConnectorCardTextInput(session)
  //                       .id("text-4")
  //                       .title("single line, max len = 10, isRequired")
  //                       .isMultiline(false)
  //                       .isRequired(true)
  //                       .maxLength(10)
  //                 ])
  //                 .actions([
  //                   new teams.O365ConnectorCardHttpPOST(session)
  //                   .id("card-2-btn-1")
  //                   .name("Send")
  //                   .body(JSON.stringify({
  //                     text1: '{{text-1.value}}',
  //                     text2: '{{text-2.value}}',
  //                     text3: '{{text-3.value}}',
  //                     text4: '{{text-4.value}}'}))
  //                 ]);

  // // date / time input examples
  // let actionCard3 = new teams.O365ConnectorCardActionCard(session)
  //                 .id("card-3")
  //                 .name("Date Input")
  //                 .inputs([
  //                   new teams.O365ConnectorCardDateInput(session)
  //                       .id("date-1")
  //                       .title("date with time")
  //                       .includeTime(true)
  //                       .isRequired(true),
  //                   new teams.O365ConnectorCardDateInput(session)
  //                       .id("date-2")
  //                       .title("date only")
  //                       .includeTime(false)
  //                       .isRequired(false)
  //                 ])
  //                 .actions([
  //                   new teams.O365ConnectorCardHttpPOST(session)
  //                   .id("card-3-btn-1")
  //                   .name("Send")
  //                   .body(JSON.stringify({
  //                     date1: '{{date-1.value}}',
  //                     date2: '{{date-2.value}}'}))
  //                 ]);

  // let section = new teams.O365ConnectorCardSection(session)
  //               .markdown(true)
  //               .title("**section title**")
  //               .text("section text")
  //               .activityTitle("activity title")
  //               .activitySubtitle("activity sbtitle")
  //               .activityImage("http://connectorsdemo.azurewebsites.net/images/MSC12_Oscar_002.jpg")
  //               .activityText("activity text")
  //               .facts([
  //                 new teams.O365ConnectorCardFact(session).name("Fact name 1").value("Fact value 1"),
  //                 new teams.O365ConnectorCardFact(session).name("Fact name 2").value("Fact value 2"),
  //               ])
  //               .images([
  //                 new teams.O365ConnectorCardImage(session).title("image 1").image("http://connectorsdemo.azurewebsites.net/images/MicrosoftSurface_024_Cafe_OH-06315_VS_R1c.jpg"),
  //                 new teams.O365ConnectorCardImage(session).title("image 2").image("http://connectorsdemo.azurewebsites.net/images/WIN12_Scene_01.jpg"),
  //                 new teams.O365ConnectorCardImage(session).title("image 3").image("http://connectorsdemo.azurewebsites.net/images/WIN12_Anthony_02.jpg")
  //               ]);

  // let card = new teams.O365ConnectorCard(session)
  //             .summary("O365 card summary")
  //             .themeColor("#E67A9E")
  //             .title("card title")
  //             .text("card text")
  //             .sections([section])
  //             .potentialAction([
  //               actionCard1, 
  //               actionCard2, 
  //               actionCard3,
  //               new teams.O365ConnectorCardViewAction(session)
  //                 .name('View Action')
  //                 .target('http://microsoft.com'),
  //               new teams.O365ConnectorCardOpenUri(session)
  //                 .id('open-uri')
  //                 .name('Open Uri')
  //                 .default('http://microsoft.com')
  //                 .iOS('http://microsoft.com')
  //                 .android('http://microsoft.com')
  //                 .windowsPhone('http://microsoft.com')]);

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