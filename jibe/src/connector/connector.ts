// const utils = require('../utils/utils.js');
// const faker = require('faker');
import * as express from 'express';
import * as rp from 'request-promise';


var connectors = {}; //Array of connectors that have been hooked up

///////////////////////////////////////////////////////
// Simple Connector setup process flow
//
// This generated page is used as the Landing page in the Connectors Developer Dashboard registration flow
function setup(_req: express.Request, res: express.Response, _next: express.NextFunction) {

    var connectorAppID: string = process.env.CONNECTOR_APP_ID || "bc32fa91-81d0-4314-9914-e718d47e90e8";
    var baseURI: string = process.env.BASE_URI || "https://jibe.azurewebsites.net";

    var htmlBody = "<html><title>Set up connector</title><body>";
    htmlBody += "<H2>Adding your Connector Portal-registered connector</H2>";
    htmlBody += '<p>Click the button to call the "register" endpoint in the sample app, which will register the connector for the selected channel and send a sample "Welcome" connector card.</p>';
    htmlBody += '<a href="https://outlook.office.com/connectors/Connect?state=myAppsState&app_id=' + connectorAppID + '&callback_url=' + baseURI + '/api/messages/connector/register">';
    htmlBody += '<img src="https://o365connectors.blob.core.windows.net/images/ConnectToO365Button.png" alt="Connect to Office 365"></img></a>';
    htmlBody += '</body></html>';

    // res.writeHead(200, {
    //     'Content-Length': Buffer.byteLength(htmlBody),
    //     'Content-Type': 'text/html'
    // });
    // res.write(htmlBody);
    res.sendFile('setup.html', {
        root: './connector',
    });
}

///////////////////////////////////////////////////////
//	Simple Connector registration flow
//
// This illustrative Connector registration code shows how your server would cache inbound requests to attach a channel as a webhook.
//  As this is not intended to show production-grade support, we've added some basic clean-up code below.
async function register(req: express.Request, res: express.Response) {

    // Parse register message from connector, find the group name and webhook url
    var query = req.query;
    var webhook_url = query.webhook_url;
    var group_name = query.group_name;
    var appType = query.app_type;
    var state = query.state;

    // Simple cleanup so we are only tracking max of 100 registered connections
    if (connectors.length > 100) {
        connectors = {};
    }

    // save the webhook url using groupname as the key
    connectors[group_name] = webhook_url;

    // Generate HTML response
    var baseURI: string = process.env.BASE_URI || "https://jibe.azurewebsites.net";
    var sendUrl = baseURI + "/api/messages/connector/send?group_name=" + group_name;
    var htmlBody = "<html><body><H2>Registered Connector added</H2>";
    htmlBody += "<li><b>App Type:</b> " + appType + "</li>";
    htmlBody += "<li><b>Group Name:</b> " + group_name + "</li>";
    htmlBody += "<li><b>State:</b> " + state + "</li>";
    htmlBody += "<li><b>Web Hook URL stored:</b> " + webhook_url + "</li>";
    htmlBody += "</body></html>";

    htmlBody += "<br><br>To generate a message to this endpoint, use this link:";
    htmlBody += "<a href='" + sendUrl + "' target='_blank'>" + sendUrl + "</a>";
    htmlBody += '</body></html>';

    res.writeHead(200, {
        'Content-Length': Buffer.byteLength(htmlBody),
        'Content-Type': 'text/html'
    });
    res.write(htmlBody);

    // Generate a sample connector message as a "welcome"
    var message = generateConnectorCard("Welcome", "This is a sample connector card sent to group: <b>" + group_name + "</b> via webhook: <b>" + webhook_url + "</b> using link: <b>" + sendUrl + "</b>");

    // Post to connector endpoint
    var options = {
        method: 'POST',
        uri: webhook_url,
        body: message,
        json: true
    };
    await rp(options);

    res.end();
}

// Generates rich connector card.
function generateConnectorCard(summary: string, text: string) {

    if (typeof summary !== 'string') {
        summary = 'joe created a new task';
    }

    if (typeof text !== 'string') {
        text = 'lorem ipsum';
    }

    var ret = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        'themeColor': '0076D7',
        'summary': summary,
        'sections': [{
            'activityTitle': summary,
            'activitySubtitle': 'On Project Jibe',
            'activityImage': `${process.env.BASE_URI}/static/img/image${Math.floor(Math.random() * 9) + 1}.png`,
            'text': text,
            'facts': [
                {
                    'name': 'Assigned to',
                    'value': 'Unassigned'
                }, {
                    'name': 'Due date',
                    'value': Date().toString()
                },
                {
                    'name': 'Status',
                    'value': 'Not started'
                }
            ],
        }],
        'potentialAction': [
            {
                '@type': 'ActionCard',
                'name': 'Add a comment',
                'inputs': [
                    {
                        '@type': 'TextInput',
                        'id': 'comment',
                        'isMultiline': false,
                        'title': 'Add a comment here for this task'
                    }
                ],
                'actions': [
                    {
                        '@type': 'HttpPOST',
                        'name': 'Add comment',
                        'target': 'http://...'
                    }
                ]
            },
            {
                '@type': 'ActionCard',
                'name': 'Set due date',
                'inputs': [
                    {
                        '@type': 'DateInput',
                        'id': 'dueDate',
                        'title': 'Enter a due date for this task'
                    }
                ],
                'actions': [
                    {
                        '@type': 'HttpPOST',
                        'name': 'Save',
                        'target': 'http://...'
                    }
                ]
            },
            {
                '@type': 'ActionCard',
                'name': 'Change status',
                'inputs': [
                    {
                        '@type': 'MultichoiceInput',
                        'id': 'list',
                        'title': 'Select a status',
                        'isMultiSelect': 'false',
                        'style': 'expanded',
                        'choices': [
                            { 'display': 'In Progress', 'value': '1' },
                            { 'display': 'Active', 'value': '2' },
                            { 'display': 'Closed', 'value': '3' }
                        ]
                    }
                ],
                'actions': [
                    {
                        '@type': 'HttpPOST',
                        'name': 'Save',
                        'target': 'http://...'
                    }
                ]
            }
        ]
    };

    return ret;
}

function init(app: express.Application) {
    app.use('/connector/setup', setup);
    app.use('/api/messages/connector/register', register);
    return this;
}

export {
    init as init,
};
