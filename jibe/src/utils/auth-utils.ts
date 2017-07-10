import * as rp from 'request-promise';
var adal = require('adal-node').AuthenticationContext;
var aad = require('azure-ad-jwt');
var crypto = require('crypto');

var authorityHostUrl = 'https://login.windows.net';
var tenant = 'common'; // '68eac915-2f41-4693-a138-14c86824d964'; // '1ea24608-de05-4c47-83e2-8da394396c3c';
var authorityUrl = authorityHostUrl + '/' + tenant;
var clientId = 'b3b1b87c-70a1-4c33-a2f3-da4c43ad7060'; // 'd742d10c-15e6-4662-80e6-5b5fb48c8c29';
var clientSecret = 'p2ETUE7jYW01YubJcAMdCfuf6wJE7zlmslXI7jNvvOg='; // 'QRGe3HFjDiCldJQ4FVU+A2vHY12p0VjJBkbO5ew6WCs=';

var graph_resource = 'https://graph.microsoft.com';
var id_resource = '00000002-0000-0000-c000-000000000000';

// User auth URLs
var redirectUri = 'http://localhost:8000/getAToken';
var templateAuthzUrl = 'https://login.windows.net/' + 
                        tenant + 
                        '/oauth2/authorize?response_type=code&client_id=' +
                        clientId + 
                        '&redirect_uri=' + 
                        redirectUri + 
                        '&scope=' +
                        'https%3A%2F%2Fgraph.microsoft.com%2Fcalendar.read%20https%3A%2F%2Fgraph.microsoft.com%2Fmail.send' +
                        '&state=<state>&resource=' + 
                        id_resource;

var registered_id = "bababc50-4dad-45b5-a10f-5b98129ccf1d";
var registered_secret = "jWHAA7sCNiHE9FRFMhXDVq1";
templateAuthzUrl = "https://login.microsoftonline.com/" + 
                    tenant +
                    "/oauth2/v2.0/authorize?" +
                    "client_id=" + registered_id +
                    "&response_type=code" +
                    "&redirect_uri=" + encodeURI(redirectUri) + 
                    "&response_mode=query" +
                    "&scope=" + encodeURI("https://graph.windows.net/directory.read.all") +
                    "&state=<state>"

// &resource=https%3A%2F%2Fgraph.microsoft.com%2F\

// Create the URL that users are redirected to for login/auth
function createAuthorizationUrl(state) {
  return templateAuthzUrl.replace('<state>', state);
}

// Clients get redirected here in order to create an OAuth authorize url and redirect them to AAD. 
// There they will authenticate and give their consent to allow this app access to 
// some resource they own. 
function oauthRedirect(req, res) {
  crypto.randomBytes(48, function(ex, buf) {
    var token = buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-');
 
    res.cookie('authstate', token);
    var authorizationUrl = createAuthorizationUrl(token);
 
    res.redirect(authorizationUrl);
  });
}

// After consent is granted AAD redirects here.  The ADAL library is invoked via the 
// AuthenticationContext and retrieves an access token that can be used to access the 
// user owned resource. 
function getUserToken(req, res) {
  console.log(JSON.stringify(req.cookies));
//   if (req.cookies.authstate !== req.query.state) {
//     res.send('error: state does not match');
//   }
  console.log("Auth code: " + req.query.code)
  var authenticationContext = new adal(authorityUrl);
  authenticationContext.acquireTokenWithAuthorizationCode(
    req.query.code,
    redirectUri,
    encodeURI("https://graph.windows.net/directory.read.all"),
    registered_id, 
    registered_secret,
    function(err, response) {
      let msg = '';
      if (err) {
        msg = 'error: ' + err.message + '\n';
      }
      msg += 'response: ' + JSON.stringify(response);
      res.send(msg);
    }
  );
}

async function getToken(): Promise<any> {
    return new Promise<any>((resolve, reject) => {

        var context = new adal(authorityUrl);
        context.acquireTokenWithClientCredentials(
            graph_resource, 
            clientId, 
            clientSecret, 
            function (err: any, tokenResponse: any) {
                if (err) {
                    return reject('no luck');
                }
                resolve(tokenResponse.accessToken);
            }
        );
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
    oauthRedirect,
    getUserToken
}


