import * as Http from 'http';
import * as express from 'express';
import * as bodyparser from 'body-parser';
import * as request from 'request';
import * as morgan from 'morgan';
import * as connector from './connector/connector';
import * as path from 'path';
var swaggerize = require('swaggerize-express');
var swaggerui = require('swaggerize-ui');

var port = process.env.PORT || 8000;

process.chdir(__dirname);

var app = express();
var server = Http.createServer(app);

app.use(morgan('tiny'));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: true,
}));

console.log("whoa: " + __dirname);

// setup swaggerize express for api (as it clears a bunch of props on express)
app.use(swaggerize({
    api: __dirname + '/config/swagger.json',
    docspath: '/swagger',
    handlers: __dirname + '/routes',
}));

// view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(express.static(__dirname + '/web'));
app.use(express.static(__dirname + '/assets'));

// connector
connector.init(app);

app.use('/docs', swaggerui({
    docs: '/swagger',
}));

app.get('/signin', doHttpRequest);

app.get('/service-worker.js', function (_req, res) {
    res.sendFile(__dirname + '/service-worker.js');
});

app.get('*', function (_req, res) {
    console.log('info');
    res.sendFile('index.html', {
        root: './web',
    });
});

function doHttpRequest(req: express.Request, res: express.Response) {

    var url = '/api/auth/login';
    var data = {
        client_id: 'f05fc322-1470-4336-82ed-45582c58d359',
        client_secret: 'fliTMcHA6VYDR+yohJJNUo1q9ZZQJuCALP5C4Qd8fFU=',
    };

    var protocol = (!req.get('x-arr-ssl')) ? 'http://' : 'https://';
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

server.listen(port, function () {
    /* eslint-disable no-console */
    console.log('Server running on %d', port);
    /* eslint-disable no-console */
});

