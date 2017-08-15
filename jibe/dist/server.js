"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Http = require("http");
const express = require("express");
const bodyparser = require("body-parser");
const request = require("request");
const morgan = require("morgan");
const connector = require("./connector/connector");
const bot = require("./bot/bot");
const slash = require("./slash/slash");
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
// setup swaggerize express for api (as it clears a bunch of props on express)
app.use(swaggerize({
    api: __dirname + '/config/swagger.json',
    docspath: '/swagger',
    basedir: __dirname,
    handlers: './routes',
}));
// view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/web'));
app.use(express.static(__dirname + '/assets'));
// connector
connector.init(app);
// bot
bot.init(app);
// slash commands
slash.init(app);
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
function doHttpRequest(req, res) {
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
//# sourceMappingURL=server.js.map