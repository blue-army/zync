import * as Http from 'http';
import * as express from 'express';
import * as bodyparser from 'body-parser';
import * as request from 'request';
import * as morgan from 'morgan';
import * as path from 'path';
import * as connector from './connector/connector';
var Swaggerize = require('swaggerize-express');
var SwaggerUi = require('swaggerize-ui');

var port = process.env.PORT || 8000;

// set process folder to current directory
process.chdir(__dirname);

var App = express();
var Server = Http.createServer(App);

App.use(morgan('tiny'));

App.use(express.static(__dirname + '/web'));
App.use(express.static(__dirname + '/assets'));

App.use(bodyparser.json());
App.use(bodyparser.urlencoded({
    extended: true,
}));

App.use(Swaggerize({
    api: path.resolve('./config/swagger.json'),
    handlers: path.resolve('./routes'),
    docspath: '/swagger',
}));

// connector
connector.init(App);

App.use('/docs', SwaggerUi({
    docs: '/swagger',
}));

App.get('/signin', doHttpRequest);

App.get('/service-worker.js', function (_req, res) {
    res.sendFile(__dirname + '/service-worker.js');
});

App.get('*', function (_req, res) {
    console.log('info');
    res.sendFile('index.html', {
        root: './web',
    });
});


function doHttpRequest(req: express.Request, res: express.Response) {
    console.log('signin');

    var url = '/api/auth/login';
    var data = {
        client_id: 'f05fc322-1470-4336-82ed-45582c58d359',
        client_secret: 'fliTMcHA6VYDR+yohJJNUo1q9ZZQJuCALP5C4Qd8fFU=',
    };

    var protocol = (!req.get('x-arr-ssl')) ? 'http://' : 'https://';
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

