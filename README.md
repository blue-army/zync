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

## questions

* where do we want to host this?
