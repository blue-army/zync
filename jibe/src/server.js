'use strict';

var fs = require('fs');
console.log(fs.existsSync);

var Http = require('http');
var Express = require('express');
var BodyParser = require('body-parser');
var Swaggerize = require('swaggerize-express');
var SwaggerUi = require('swaggerize-ui');
var request = require('request');
var morgan = require('morgan');
var Path = require('path');

var port = process.env.PORT || 8000;

// set process folder to current directory
process.chdir(__dirname);

var App = Express();
var Server = Http.createServer(App);

App.use(morgan('tiny'));

App.use(Express.static(__dirname + '/web'));
App.use(Express.static(__dirname + '/assets'));

App.use(BodyParser.json());
App.use(BodyParser.urlencoded({
    extended: true,
}));

App.use(Swaggerize({
    api: Path.resolve('./config/swagger.json'),
    handlers: Path.resolve('./handlers'),
    docspath: '/swagger',
}));

App.use('/docs', SwaggerUi({
    docs: '/swagger',
}));

App.get('/signin', doHttpRequest);

App.get('/service-worker.js', function (req, res) {
    res.sendFile(__dirname + '/service-worker.js');
});

App.get('*', function (req, res) {
    console.log('info');
    res.sendFile('index.html', {
        root: './web',
    });
});


function doHttpRequest(req, res) {
    console.log('signin');

    var url = '/auth/login';
    var data = {
        client_id: 'f05fc322-1470-4336-82ed-45582c58d359',
        client_secret: 'fliTMcHA6VYDR+yohJJNUo1q9ZZQJuCALP5C4Qd8fFU=',
    };

    var protocol = (req.get('x-site-deployment-id') && !req.get('x-arr-ssl')) ? 'http://' : 'https://';
    console.log(protocol);

    var options = {
        method: 'POST',
        json: true,
        url: protocol + req.headers.host + url,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: data,
    };

    request(options, function (err, resp, body) {
        if (err) {
            console.error('error authenticating user: ', err);
        }
        var headers = resp.headers;
        var statusCode = resp.statusCode;
        console.log('headers: ', headers);
        console.log('statusCode: ', statusCode);
        console.log('body: ', body);

        res.json(body);
    });
}

Server.listen(port, function () {
    /* eslint-disable no-console */
    console.log('Server running on %d', port);
    /* eslint-disable no-console */
});

