# jibe

Swagger api [location](./config/swagger.json)

## storyboard

* create team when drill-plan (dpln) project is created
* add / remove member to team when user is added / removed to dpln project
* notifications on teams channels on changes to dpln
* docusign final well program pdf
* my tasks / my reviews on a teams tab
* bot for Q & A

## questions

* common team for drill-plan (dpln) / drill-ops (dops)
* what are the cross-app notifications

## misc

```bash
# launch swagger editor
docker run --rm -d -p 80:8080 swaggerapi/swagger-editor
```

## issues

* cmdlet to create team
* how to run a cmdlet on azure?
* contact person for issues - billbl@microsoft.com
* authentication for the graph explorer
* possible to @mention in a message card - may not be possible in an actionable card
* what drives the activity feed in Team
* cannot create tabs for a channel via api
* yeoman generator (https://www.npmjs.com/package/generator-teams)
* building a bot walkthrough with Bill

## developers

* in vscode create a new integrated terminal and run `nodemon --config auto-nodemon.json` from within the jibe folder. that will monitor the `src` folder for any changes and run a build script (`/scripts/auth.sh`). you can just leave that terminal running continuously.
* to debug just hit F5 (or whatever your shortcut is to launch) the `jibe server` configuration. this will create another interated terminal running the `/dist/server.js` + attach the debugger. and it will automatically restart if there are any changes to the `dist` folder. one thing to note, that if you stop debugging it will NOT stop that running nodemon process, so you will still have to kill (`ctrl+c`) that explicitly.
* To develop with [localtunnel](https://localtunnel.github.io/www/), first install Localtunnel with npm (`npm install -g localtunnel`).  Start your local server, then create the tunnel by running 
    ```
    lt --port 8000 --subdomain "jibe"
    ```
    The `--port` parameter should match your local server's port number.  Since we provided a custom subdomain, the resulting publically accessible url will be https://jibe.localtunnel.me (if it's available).  



## todo

* svc
  * link drillplan project id properly
  * [done] save all events from drillplan
  * [done] expose api to fetch messages
  * [done] fix deep links
  * add authentication
  * channel management
  * [done] routing rules
  * api for user management
* ui
  * create project-specific view
  * [done] display project messages
  * channel management
  * routing rule management
  * user management
* look into connectors as a way to 'configure webhooks'
* [done] try out the github connector

## events

`POST https://jibe.azurewebsites.net/api/events`
```json
{
    "type": "slb.drill-plan.activity",
    "project": "33839ffe-90f9-4cc4-a906-f7ad2e77bb1f",
    "content": {
        "id": "1-dd5bc9dab23e4059b5b363af55eb907c",
        "owner": {
            "full_name": "Greg Skoff",
            "image_url": ""
        },
        "activity": {
            "type": "Share",
            "entity_id": "0985e6a5809c42599a6d6e7b8e85f548",
            "entity_name": "Untitled BHA/Drillstring",
            "activity_time": "2017-05-03T19:36:40.7948026Z",
            "comments": "snap",
            "project_id": "1-f85b9dec6de340598689babbbf1a48f0",
            "activity_entity_type": "BHA&Drillstring",
            "is_customer_data": false,
            "changed_property_names": [],
            "extension_propertys_dic": {
                "client_name": "Cimerex"
            },
            "parent": {
                "id": "1-61fb6a60485d43b1994c510fb2198f1e",
                "entity_type": "run",
                "name": "Run",
                "parent": {
                    "id": "1-45328fe7f98c439ba1b217d5b551f0f4",
                    "entity_type": "section",
                    "name": "8.75 in",
                    "parent": {
                        "id": "1-f85b9dec6de340598689babbbf1a48f0",
                        "entity_type": "project",
                        "name": "White City 8 Federal #4H–Cimerex",
                        "parent": null
                    }
                }
            }
        }
    }
}
```

## questions

* where do we want to host jibe wrt drill[plan|ops]?
* integrate better with connector configuration dialog window
* how do we re-configure a connector?
* how to know Office is redirecting on connector registration (check referrer header)
* avoid public calls to connector/[setup | register]
* how do we improve app service warm-up time
* delete group only works from v1.0. Fails when called from beta graph API.
* how do the application / delegated permissions work?
  * directory.readwrite - why is Limited Admin insufficient?
* how do messages end up in the activity feed
* do notifications (on mobile app) work?
* what do the options in 'Enable this integration for ...' in the connector registration ui
* suggestions for supporting different levels of apps / app environments (wrt authentication)
* callback when connector is removed (or a way to query connectors)
* actionable messages on connector cards (can see on the connector registration portal)
* user information within a channel / connector
