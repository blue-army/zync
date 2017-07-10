'use strict';
var fs = require('fs');
console.log(fs.existsSync);
var Http = require('http');
var Express = require('express');
var BodyParser = require('body-parser');
var Swaggerize = require('swaggerize-express');
var SwaggerUi = require('swaggerize-ui');
var Path = require('path');
var AuthUtils = require('./utils/auth-utils');
var passport = require('passport');
// Passport stuff
var BearerStrategy = require('passport-azure-ad').BearerStrategy;
var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
var config = require('./passport-config'); // create this
var port = process.env.PORT || 8000;
// set process folder to current directory
process.chdir(__dirname);
//-----------------------------------------------------------------------------
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session.  Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
//-----------------------------------------------------------------------------
passport.serializeUser(function (user, done) {
    done(null, user.oid);
});
passport.deserializeUser(function (oid, done) {
    findByOid(oid, function (err, user) {
        done(err, user);
    });
});
// array to hold logged in users
var users = [];
// Use passport for user auth
passport.use(new OIDCStrategy({
    identityMetadata: config.creds.identityMetadata,
    clientID: config.creds.clientID,
    responseType: config.creds.responseType,
    responseMode: config.creds.responseMode,
    redirectUrl: config.creds.redirectUrl,
    allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
    clientSecret: config.creds.clientSecret,
    validateIssuer: config.creds.validateIssuer,
    isB2C: config.creds.isB2C,
    issuer: config.creds.issuer,
    passReqToCallback: config.creds.passReqToCallback,
    scope: config.creds.scope,
    loggingLevel: config.creds.loggingLevel,
    nonceLifetime: config.creds.nonceLifetime,
    nonceMaxAmount: config.creds.nonceMaxAmount,
    useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
    cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
    clockSkew: config.creds.clockSkew,
}, function (iss, sub, profile, accessToken, refreshToken, done) {
    if (!profile.oid) {
        return done(new Error("No oid found"), null);
    }
    // asynchronous verification, for effect...
    process.nextTick(function () {
        findByOid(profile.oid, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                // "Auto-registration"
                users.push(profile);
                return done(null, profile);
            }
            return done(null, user);
        });
    });
}));
var options = {
    identityMetadata: config.creds.identityMetadata,
    clientID: config.creds.clientID,
    validateIssuer: config.creds.validateIssuer,
    issuer: config.creds.issuer,
    passReqToCallback: config.creds.passReqToCallback,
    isB2C: config.creds.isB2C,
    policyName: config.creds.policyName,
    allowMultiAudiencesInToken: config.creds.allowMultiAudiencesInToken,
    audience: config.creds.audience,
    loggingLevel: config.creds.loggingLevel,
    clockSkew: config.creds.clockSkew,
    scope: config.creds.scope
};
var findById = function (id, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.sub === id) {
            log.info('Found user: ', user);
            return fn(null, user);
        }
    }
    return fn(null, null);
};
var bearerStrategy = new BearerStrategy(options, function (token, done) {
    console.log('verifying the user');
    console.log(token, 'was the token retreived');
    findById(token.sub, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            // "Auto-registration"
            console.log('User was added automatically as they were new. Their sub is: ', token.sub);
            users.push(token);
            owner = token.sub;
            return done(null, token);
        }
        owner = token.sub;
        return done(null, user, token);
    });
});
passport.use(bearerStrategy);
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth');
}
;
var App = Express();
//App.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
var Server = Http.createServer(App);
App.use(BodyParser.json());
App.use(BodyParser.urlencoded({
    extended: true
}));
App.use(passport.initialize());
//App.use(passport.session());
App.use(Swaggerize({
    api: Path.resolve('./config/swagger.json'),
    handlers: Path.resolve('./handlers'),
    docspath: '/swagger'
}));
App.use('/docs', SwaggerUi({
    docs: '/swagger'
}));
// User auth endpoints
App.get('/auth', AuthUtils.oauthRedirect);
App.get('/getAToken', function (req, res) {
    res.send("logged in!");
});
App.get("/auth/openid/return", token_auth, function (req, res) {
    res.send("logged in!");
});
function token_auth(req, res, next) {
    console.log("Token auth");
    passport.authenticate('oauth-bearer', {
        response: res,
        session: false
    })(req, res, next);
}
function id_auth(req, res, next) {
    console.log("ID Auth");
    passport.authenticate('azuread-openidconnect', {
        response: res,
        failureFlash: 'ID auth failure',
        session: false
    })(req, res, next);
}
App.get('/test', id_auth, token_auth, function (req, res) {
    console.log('We received a return from AzureAD.');
    res.send('test endpt');
});
App.post('/getAToken', function (req, res) {
    console.log(req.body);
    res.redirect('/auth/openid/return');
});
Server.listen(port, function () {
    /* eslint-disable no-console */
    console.log('Server running on %d', port);
    /* eslint-disable no-console */
});
//# sourceMappingURL=server.js.map