'use strict';

var Http = require('http');
var Express = require('express');
var BodyParser = require('body-parser');
var Swaggerize = require('swaggerize-express');
var SwaggerUi = require('swaggerize-ui');
var Path = require('path');

var port = process.env.PORT || 8000;

var App = Express();

var Server = Http.createServer(App);

App.use(BodyParser.json());
App.use(BodyParser.urlencoded({
    extended: true
}));

App.use(Swaggerize({
    api: Path.resolve('./config/swagger.json'),
    handlers: Path.resolve('./handlers'),
    docspath: '/swagger'
}));

App.use('/docs', SwaggerUi({
    docs: '/swagger'  
}));

Server.listen(port, function () {
    /* eslint-disable no-console */
    console.log('Server running on %d', port);
    /* eslint-disable no-console */
});
