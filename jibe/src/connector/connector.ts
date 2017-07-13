// const utils = require('../utils/utils.js');
// const faker = require('faker');
import * as express from 'express';
import * as rp from 'request-promise';


var connectors = {}; //Array of connectors that have been hooked up

///////////////////////////////////////////////////////
// Simple Connector setup process flow
//
// This generated page is used as the Landing page in the Connectors Developer Dashboard registration flow
function setup(req: express.Request, res: express.Response, next) {

    var connectorAppID: string = process.env.CONNECTOR_APP_ID || "253c752c-39cb-4b71-aa75-dac82383484e";
    var baseURI: string = process.env.BASE_URI || "https://jibe.azurewebsites.net";

    var htmlBody = "<html><title>Set up connector</title><body>";
    htmlBody += "<H2>Adding your Connector Portal-registered connector</H2>";
    htmlBody += '<p>Click the button to call the "register" endpoint in the sample app, which will register the connector for the selected channel and send a sample "Welcome" connector card.</p>';
    htmlBody += '<a href="https://outlook.office.com/connectors/Connect?state=myAppsState&app_id=' + connectorAppID + '&callback_url=' + baseURI + '/api/messages/connector/register">';
    htmlBody += '<img src="https://o365connectors.blob.core.windows.net/images/ConnectToO365Button.png" alt="Connect to Office 365"></img></a>';
    htmlBody += '</body></html>';

    res.writeHead(200, {
        'Content-Length': Buffer.byteLength(htmlBody),
        'Content-Type': 'text/html'
    });
    res.write(htmlBody);
    res.end();
}

///////////////////////////////////////////////////////
//	Simple Connector registration flow
//
// This illustrative Connector registration code shows how your server would cache inbound requests to attach a channel as a webhook.
//  As this is not intended to show production-grade support, we've added some basic clean-up code below.
async function register(req: express.Request, res:) {

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
    // create request
    var options = {
        method: 'POST',
        uri: webhook_url,
        body: message,
        json: true
    };

    // invoke
    let val = await rp(options);
    res.end();
}

///////////////////////////////////////////////////////
//	Simple Connector send test
//
// This endpoint allows for sending connector messages. 
// For registered connectors, you pass in the Group Name that it was registered to.
// For incoming webhooks, you pass in the webhook URL that was created via the incoming webhook registration.
function send(req, res) {

    // For registered connectors, we must pass in the group_name
    var group_name = (typeof req.params.group_name === 'string') ? req.params.group_name : '';

    // For incoming webhooks, we must pass in the webhook
    var webhook_url = (typeof req.params.webhook_url === 'string') ? req.params.webhook_url : null;

    // If no incoming webhook, lookup the registered connector name
    webhook_url = (webhook_url === null) ? ((connectors[group_name]) ? connectors[group_name] : null) : webhook_url;

    // If we don't know about the connector and we don't have a webhook url then fail
    if (!webhook_url) {
        res.send(`A connector for ${group_name} has not been setup`);
        res.end();
    }
    else {
        // Generate a sample random connector message
        var message = generateConnectorCard();

        // Generate HTML response
        var htmlBody = "<html><body><H3>Sent Connector card to:</H3>"
        if (group_name !== '') {
            htmlBody += '<p>group_name: <b>' + group_name + '</b></p>';
        }
        htmlBody += '<p>webhook: <b>' + webhook_url + '</b></p>';
        htmlBody += '</body></html>';

        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(htmlBody),
            'Content-Type': 'text/html'
        });
        res.write(htmlBody);

        // Post to connector endpoint
        rest.postJson(webhook_url, message).on('complete', function (data, response) {
            res.end();
        });
    }
}

///////////////////////////////////////////////////////
//	Helpers and other methods
///////////////////////////////////////////////////////
// Generates rich connector card.
function generateConnectorCard(summary, text) {

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
            'activitySubtitle': 'On Project Tango',
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
    }
    return ret;
}

function init(app: express.Application) {
    app.use('/connector/setup', setup);
    app.use('/api/messages/connector/register', register);
    app.use('/api/messages/connector/send', send);
    return this;
}

///////////////////////////////////////////////////////
//	Exports
///////////////////////////////////////////////////////
export {
    init as init,
};

// connector: https://outlook.office.com/webhook/3360b99a-4cd9-49cb-90b5-2b43c264fee5@68eac915-2f41-4693-a138-14c86824d964/253c752c-39cb-4b71-aa75-dac82383484e/7bf2d46c49b5470ea14a66774e3be783/fbf51db5-f1d3-4640-8ed4-0583adac29ad
// webhook:   https://outlook.office.com/webhook/3360b99a-4cd9-49cb-90b5-2b43c264fee5@68eac915-2f41-4693-a138-14c86824d964/IncomingWebhook/59c7ad4cc70d43648b37a7ed3058809f/fbf51db5-f1d3-4640-8ed4-0583adac29ad