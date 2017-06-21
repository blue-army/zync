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

## todo

* svc
  * link drillplan project id properly
  * save all messages from drillplan
  * expose api to fetch messages
  * fix deep links - done
  * add authentication
  * channel management
  * routing rules
  * api for user management
* ui
  * create project-specific view
  * display project messages
  * channel management
  * routing rule management
  * user management