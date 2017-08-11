import * as models from "../../models/models";
import * as jibe from "../../service/jibe"
import * as uuid from "uuid";
import * as _ from 'lodash';
import * as rp from 'request-promise';
import * as express from 'express';
import * as bot from "../../bot/bot"
import * as drillplan from "../../plugins/drillplan"

// handles GET requests
function list_events(_req: express.Request, res: express.Response) {
    // retrieve events from db
    jibe.getEventList()
        .then(events => {
            res.json(events);
        })
        .catch((err) => {
            handleError(err, res);
        });
}

// handles PUT requests
async function upsert_event(req: express.Request, res: express.Response) {

    // Check that request has been authenticated
    if (!res.locals['x-caller']) {
        res.status(401).send("Unauthorized request");
        return;
    }

    let payload = req.body;

    // generate id if not provided
    payload['id'] = _.get<Object, string>(payload, 'id', uuid.v4());
    if (payload['id'].length === 0) {
        payload['id'] = uuid.v4();
    }
    let info = models.EventInfo.fromObj(payload);

    // Check for presence of required properites
    var required = ['type', 'project', 'content'];
    for (let prop of required) {
        if (!info[prop]) {
            res.status(400).send({ Error: "Missing required property '{{prop}}'".replace('{{prop}}', prop) });
            return;
        }
    }

    // add event to db
    jibe.upsertEvent(info)
        .then((event) => {
            info = event;
            return routeEvent(event);   // send event to subscribers
        })
        .then(() => {
            // routing successful - reply with the upserted event
            res.json(info);
        })
        .catch(() => {
            res.status(400).send({
                Error: "Error handling the event"
            });
        });
}

async function routeEvent(event_info: models.EventInfo) {

    // Create card to send
    let card = drillplan.createO365MessageCard(event_info);
    let cardJson = card.toAttachment().content;

    // fetch project information
    let doc = await jibe.getProject(event_info.project)
    if (doc !== null) {
        let proj = models.ProjectInfo.fromObj(doc);

        // get the route that matches the event
        var routes = getCardRoutes(proj, event_info);

        var promises = []
        var options = {
            method: 'POST',
            uri: "",
            body: cardJson,
            json: true
        };

        for (let route of routes) {
            // if the route has an associated webhook, send a message to it
            if (route.webhook) {
                options.uri = route.webhook;
                promises.push(rp(options));
            }

            // also look for a matching channel with a webhook or bot address
            if (route.channel || route.channelId) {
                for (let c of proj.channels) {
                    // check if the channel's id or name matches the channel info specified in the route
                    if ((route.channel && c.name === route.channel) || (route.channelId && c.id === route.channelId)) {
                        // If the channel has an associated webhook, send card to it
                        if (c.webhook) {
                            options.uri = c.webhook;
                            promises.push(rp(options));
                        }
                        // If the channel has a bot address, send the card to it via the bot
                        if (c.botaddress) {
                            bot.sendActionableCard(c.botaddress, card)
                        }
                    }
                }
            }
        }
        return Promise.all(promises);
    }

    return;
}

// Return all project routes that match the event
function getCardRoutes(proj: models.ProjectInfo, eventInfo: models.EventInfo): models.RouteInfo[] {
    return proj.routes.filter(function (r) {
        let rexp = new RegExp(r.expr);
        let data = _.get(eventInfo.content, r.path, undefined);
        return (data && rexp.test(data));
    });
}

function handleError(error: any, res: any) {
    console.log('\nAn error with code \'' + error.code + '\' has occurred:');
    console.log('\t' + JSON.parse(error.body).message);

    res.status(500);
    res.send('error');
}

export {
    list_events as get,
    upsert_event as put,
}