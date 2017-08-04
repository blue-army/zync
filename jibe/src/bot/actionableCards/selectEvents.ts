import * as teams from 'botbuilder-teams';
import * as builder from 'botbuilder';

function createCard(session: builder.Session) {

    let actionCard1 = new teams.O365ConnectorCardActionCard(session)
                    .id("card-1")
                    .name("Multiple Choice")
                    .inputs([
                        new teams.O365ConnectorCardMultichoiceInput(session)
                            .id("list-1")
                            .title("Pick multiple options")
                            .isMultiSelect(true)
                            .isRequired(true)
                            .style('expanded')
                            .choices([
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 1").value("1"),
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 2").value("2"),
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 3").value("3")
                            ]),
                        new teams.O365ConnectorCardMultichoiceInput(session)
                            .id("list-2")
                            .title("Pick multiple options")
                            .isMultiSelect(true)
                            .isRequired(true)
                            .style('compact')
                            .choices([
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 4").value("4"),
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 5").value("5"),
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice 6").value("6")
                            ]),
                        new teams.O365ConnectorCardMultichoiceInput(session)
                            .id("list-3")
                            .title("Pick an options")
                            .isMultiSelect(false)
                            .style('expanded')
                            .choices([
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice a").value("a"),
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice b").value("b"),
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice c").value("c")
                            ]),
                        new teams.O365ConnectorCardMultichoiceInput(session)
                            .id("list-4")
                            .title("Pick an options")
                            .isMultiSelect(false)
                            .style('compact')
                            .choices([
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice x").value("x"),
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice y").value("y"),
                            new teams.O365ConnectorCardMultichoiceInputChoice(session).display("Choice z").value("z")
                            ])
                    ])
                    .actions([
                        new teams.O365ConnectorCardHttpPOST(session)
                        .id("card-1-btn-1")
                        .name("Send")
                        .body(JSON.stringify({
                        list1: '{{list-1.value}}',
                        list2: '{{list-2.value}}',
                        list3: '{{list-3.value}}',
                        list4: '{{list-4.value}}'}))
                    ]);

    let section = new teams.O365ConnectorCardSection(session)
                    .markdown(true)
                    .title("**section title**")
                    .text("section text")
                    .activityTitle("activity title")
                    .activitySubtitle("activity sbtitle")
                    .activityImage("http://connectorsdemo.azurewebsites.net/images/MSC12_Oscar_002.jpg")
                    .activityText("activity text")
                    .facts([
                    new teams.O365ConnectorCardFact(session).name("Fact name 1").value("Fact value 1"),
                    new teams.O365ConnectorCardFact(session).name("Fact name 2").value("Fact value 2"),
                    ])
                    .images([
                    new teams.O365ConnectorCardImage(session).title("image 1").image("http://connectorsdemo.azurewebsites.net/images/MicrosoftSurface_024_Cafe_OH-06315_VS_R1c.jpg"),
                    new teams.O365ConnectorCardImage(session).title("image 2").image("http://connectorsdemo.azurewebsites.net/images/WIN12_Scene_01.jpg"),
                    new teams.O365ConnectorCardImage(session).title("image 3").image("http://connectorsdemo.azurewebsites.net/images/WIN12_Anthony_02.jpg")
                    ]);

    let card = new teams.O365ConnectorCard(session)
                .summary("O365 card summary")
                .themeColor("#E67A9E")
                .title("card title")
                .text("card text")
                .sections([section])
                .potentialAction([
                    actionCard1,
                    new teams.O365ConnectorCardViewAction(session)
                    .name('View Action')
                    .target('http://microsoft.com'),
                    new teams.O365ConnectorCardOpenUri(session)
                    .id('open-uri')
                    .name('Open Uri')
                    .default('http://microsoft.com')
                    .iOS('http://microsoft.com')
                    .android('http://microsoft.com')
                    .windowsPhone('http://microsoft.com')]);

    return card;
}

export {
    createCard as createCard,
}
