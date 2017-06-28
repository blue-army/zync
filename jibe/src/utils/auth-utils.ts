import { Headers } from 'request';
import * as rp from 'request-promise';
var adal = require('adal-node').AuthenticationContext;
var aad = require('azure-ad-jwt');

var authorityHostUrl = 'https://login.windows.net';
var tenant = '1ea24608-de05-4c47-83e2-8da394396c3c';
var authorityUrl = authorityHostUrl + '/' + tenant;
var clientId = 'c482a377-26c4-4a72-9a88-176e33d7c52a';
var clientSecret = 'E8sKhD679NnuVXj2KF6lRHzQNN/Av7vK+AmlfrLLJC8=';

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

    return new Promise<any>((resolve, reject) => {

        aad.verify(token, null, function (err: any, result: any) {

            if (err) {
                reject(err);
            }

            resolve(result);
        });
    });
}

async function login(resource: string, clientId: string, clientSecret: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {

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

    let val = await rp(options);
    return val;
}

export {
    getToken,
    login,
    validate,
    graph_resource,
    id_resource,
    getAppInfo,
}


