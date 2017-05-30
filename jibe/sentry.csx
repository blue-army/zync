var http = require('http');

module.exports = function (context, data) {
    context.log('Webhook was triggered!: ' + JSON.stringify(data));

    // Check if we got first/last properties
    // if('first' in data && 'last' in data) {
    //     context.res = {
    //         body: { greeting: 'Hello ' + data.first + ' ' + data.last + '!'}
    //     };
    // }
    // else {
    //     context.res = {
    //         status: 400,
    //         body: { error: 'Please pass first/last properties in the input object'}
    //     };
    // }

    text = data.text
    var symbol = text.replace('Sentry', '').trim()
    var host = 'dev.markitondemand.com';
    var path = '/MODApis/Api/v2/Quote/json?symbol=' + symbol;

    var options = {
        host: host,
        path: path
    };

    callback = function(response) {
        var str = '';

        // another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {

            data = JSON.parse(str)

            context.res = {
                status: 200,
                body: {
                    "text": symbol.toUpperCase() + ': $' + data.LastPrice
                }
            }

            context.log('result: ' + JSON.stringify(context.res));

            context.done();
        });
    }

    http.request(options, callback).end();
}
