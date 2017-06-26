'use strict';

var adal = require('adal-node').AuthenticationContext;
var aad = require('azure-ad-jwt');

var authorityHostUrl = 'https://login.windows.net';
var tenant = '1ea24608-de05-4c47-83e2-8da394396c3c';
var authorityUrl = authorityHostUrl + '/' + tenant;
var clientId = 'c482a377-26c4-4a72-9a88-176e33d7c52a';
var clientSecret = 'E8sKhD679NnuVXj2KF6lRHzQNN/Av7vK+AmlfrLLJC8=';

var resource = '00000002-0000-0000-c000-000000000000';
var thetoken = 'eyJ0eXAiOiJKV1QiLCJub25jZSI6IkFRQUJBQUFBQUFCbmZpRy1tQTZOVGFlN0NkV1c3UWZkYWxnbmtOV2F3ZEJ3TXlwaXZFa0lxbWxKWmQ3Q1VoeEZjUVVUVk42RXRMQ2tYRTdiUnJnT1FfRlNTMkZmTzQ2bTlSWXBWb0p2U2JqOTNpUF9hMTl2ZFNBQSIsImFsZyI6IlJTMjU2IiwieDV0IjoiOUZYRHBiZk1GVDJTdlF1WGg4NDZZVHdFSUJ3Iiwia2lkIjoiOUZYRHBiZk1GVDJTdlF1WGg4NDZZVHdFSUJ3In0.eyJhdWQiOiJodHRwczovL2dyYXBoLm1pY3Jvc29mdC5jb20iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8xZWEyNDYwOC1kZTA1LTRjNDctODNlMi04ZGEzOTQzOTZjM2MvIiwiaWF0IjoxNDk3NTU0MTU5LCJuYmYiOjE0OTc1NTQxNTksImV4cCI6MTQ5NzU1ODA1OSwiYWlvIjoiWTJaZ1lGZ21aOFMrWDJXeHI0OVA1Z1hqcno1WkFBPT0iLCJhcHBfZGlzcGxheW5hbWUiOiJ3YXp6YXAiLCJhcHBpZCI6ImM0ODJhMzc3LTI2YzQtNGE3Mi05YTg4LTE3NmUzM2Q3YzUyYSIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzFlYTI0NjA4LWRlMDUtNGM0Ny04M2UyLThkYTM5NDM5NmMzYy8iLCJvaWQiOiI5ZTFjZWYzMy03MjNiLTQzOGUtOGNiNy1kOTE0YTc3MWNlOTYiLCJyb2xlcyI6WyJVc2VyLlJlYWQuQWxsIl0sInN1YiI6IjllMWNlZjMzLTcyM2ItNDM4ZS04Y2I3LWQ5MTRhNzcxY2U5NiIsInRpZCI6IjFlYTI0NjA4LWRlMDUtNGM0Ny04M2UyLThkYTM5NDM5NmMzYyIsInV0aSI6IjVfdnkyU3I1dmtpU25PN0pPcWdLQUEiLCJ2ZXIiOiIxLjAifQ.NqNB8Qy-Cfx1jckRWcgcm58OCwYh8VRYP63kzbwgXXo9M0VHpoIkQZ76EPzjZ-5bUpPeifmMRQoRrDVGC8K0itNuo43wC7nVYds4ZDp6t0SatWxRJUnEhrFt4000cum1Gk8jn8sQuh7vzK5Sh1aKyvX4i3q5iSuFJSLinT5omBztH2NhkXQnRGHtrIwd4nUKytoqVdxHA9cbNyVn7snmsWXJekSs728DTG3IjFROAqU3vI6e8DhXnDKbnietweGxZ1f5MV_o2thB9JcJbvarmHRU6uxiUirImaMkE65osbN0-RmMMxMf228P4f9uXS1GFNqbpMdWyjA5Sr5RB45NbQ';

async function getToken(): Promise<any> {
    return new Promise<any>((resolve, reject) => {

        var context = new adal(authorityUrl);
        context.acquireTokenWithClientCredentials(resource, clientId, clientSecret, function (err: any, tokenResponse: any) {
            if (err) {
                return reject('no luck');
            }

            aad.verify(tokenResponse.accessToken, null, function(err, result) {
                console.log(err);
                console.log(result);
            });

            resolve(tokenResponse);
        });
    });
}

async function login(clientId: string, clientSecret: string): Promise<any> {
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


export {
    getToken,
    login,
}


