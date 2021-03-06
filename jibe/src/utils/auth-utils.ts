import * as rp from 'request-promise';
var adal = require('adal-node').AuthenticationContext;
var aad = require('azure-ad-jwt');

var authorityHostUrl = 'https://login.windows.net';
var tenant = '68eac915-2f41-4693-a138-14c86824d964'; // '1ea24608-de05-4c47-83e2-8da394396c3c';
var authorityUrl = authorityHostUrl + '/' + tenant;
var clientId = 'b3b1b87c-70a1-4c33-a2f3-da4c43ad7060'; // 'd742d10c-15e6-4662-80e6-5b5fb48c8c29';
var clientSecret = 'p2ETUE7jYW01YubJcAMdCfuf6wJE7zlmslXI7jNvvOg='; // 'QRGe3HFjDiCldJQ4FVU+A2vHY12p0VjJBkbO5ew6WCs=';

var graph_resource = 'https://graph.microsoft.com';
var id_resource = '00000002-0000-0000-c000-000000000000';


async function getToken(): Promise<any> {
    return new Promise<any>((resolve, reject) => {

        var context = new adal(authorityUrl);
        context.acquireTokenWithClientCredentials(graph_resource, clientId, clientSecret, function (err: any, tokenResponse: any) {
            if (err) {
                return reject('no luck');
            }

            resolve(tokenResponse.accessToken);
        });
    });
}

async function validate(token: string): Promise<any> {

    if (!token || token.length === 0) {
        return null;
    }

    return new Promise<any>((resolve, reject) => {

        aad.verify(token, null, function (err: any, result: any) {

            if (err) {
                reject(err);
            }

            resolve(result);
        });
    });
}

interface Token {
    accessToken: string;
}

interface ClientInfo {
    id: string;
    name: string;
}

async function login(resource: string, clientId: string, clientSecret: string): Promise<Token> {
    return new Promise<Token>((resolve, reject) => {

        var context = new adal(authorityUrl);
        context.acquireTokenWithClientCredentials(resource, clientId, clientSecret, function (err: any, tokenResponse: any) {
            if (err) {
                return reject(null);
            }

            resolve(tokenResponse);
        });
    });
}

async function getAppInfo(jwt: any): Promise<any> {

    let token = await getToken();

    var options = {
        method: 'GET',
        uri: 'https://graph.microsoft.com/beta/applications/' + jwt['appid'],
        headers: {
            'Authorization': 'Bearer ' + token,
        },
        json: true
    };

    try {
        let val = await rp(options);
        return val;
    } catch (error) {
        return null;
    }
}

export {
    getToken,
    login,
    validate,
    graph_resource,
    id_resource,
    getAppInfo,
    Token,
    ClientInfo,
}


