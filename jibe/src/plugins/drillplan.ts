import * as models from "../models/models"
import * as pu from '../utils/prop-utils';
import * as teams from 'botbuilder-teams';      // import O365ConnectorCard classes

var events = [
    {
        "name": "BHA",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^BHA&Drillstring$",
        }
    },
    {
        "name": "Bit Selection",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^Bit Selection$",
        }
    },
    {
        "name": "Drilling Fluid",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^drilling fluid$",
        }
    },
    {
        "name": "Casing Design",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^casign design$",
        }
    },
    {
        "name": "Cementing",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^define cement job$",
        }
    },
    {
        "name": "Logistics",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^logistics$",
        }
    },
    {
        "name": "Mud Design",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^mud design$",
        }
    },
    {
        "name": "Rig",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^rig$",
        }
    },
    {
        "name": "Trajectory",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^trajectory$",
        }
    },
    {
        "name": "Target",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^target$",
        }
    },
    {
        "name": "Risks",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^risks$",
        }
    },
    {
        "name": "Project",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^project$",
        }
    },
    {
        "name": "Section",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^section$",
        }
    },
    {
        "name": "Surface Location",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^Surface Location$",
        }
    }
];

function createTeamsMessageCard(info: models.EventInfo): models.TeamsMessageCard {

    let card = new models.TeamsMessageCard();
    let activityInfo = models.ActivityInfo.fromObj(info.content);
    let details = activityInfo.activity;

    let ancestorPath = details.getAncestorPath();
    card.sections.push(
        models.SectionInfo.CreateActivityCard(
            details.getEntityImageUrl(),
            details.entity_name,
            models.ActivityDetails.getActivitySubtitle1(ancestorPath),
            models.ActivityDetails.getActivitySubtitle2(ancestorPath),
            false));

    card.sections.push(
        models.SectionInfo.CreateActivityCard(
            activityInfo.owner.image_url,
            details.getExpectedAction(),
            activityInfo.owner.full_name,
            details.comments,
            true));

    card.actions.push(new models.ActionInfo("Launch Application", details.getEntityUrl()));
    return card;
}

function createO365MessageCard(info: models.EventInfo): teams.O365ConnectorCard {
    let messageInfo = createMessageInfo(info);

    // Section displaying event details
    let eventInfoSection = new teams.O365ConnectorCardSection()
        .activityImage(messageInfo.typeImageUrl)
        .activityTitle(messageInfo.subtitle1)
        .activitySubtitle(messageInfo.subtitle2)

    // Section displaying user's name and image
    let userInfoSection = new teams.O365ConnectorCardSection()
        .activityTitle("Changed by:")
        .activitySubtitle(messageInfo.ownerFullName)

    // only add an image url if we have one - using an empty string prevents the card from rendering when sent by the bot
    // Image urls that do not begin with 'http://' or 'https://' will also cause the request to be rejected (Error: 400 Bad Request)
    if (messageInfo.userImageUrl && messageInfo.userImageUrl.search("^https?:\/\/") === 0) {
        userInfoSection.activityImage(messageInfo.userImageUrl);
    }

    // Create 'launch application' button
    let button = new teams.O365ConnectorCardViewAction()
        .name("Launch Application")
        .target(messageInfo.actionUrl)

    // Create full card
    let card = new teams.O365ConnectorCard()
        .summary("Event Notification")
        .themeColor("0078D7")
        .title(messageInfo.activityEntityType + ': ' + messageInfo.entityName)
        .sections([eventInfoSection, userInfoSection])
        .potentialAction([button]);
    return card;
}

function createMessageInfo(info: models.EventInfo): models.MessageInfo {

    let msgInfo = new models.MessageInfo();
    let activityInfo = models.ActivityInfo.fromObj(info.content);
    let details = activityInfo.activity;

    let ancestorPath = details.getAncestorPath();
    msgInfo.id = info.id;
    msgInfo.typeImageUrl = details.getEntityImageUrl();
    msgInfo.entityName = details.entity_name;
    msgInfo.activityEntityType = details.activity_entity_type;
    msgInfo.subtitle1 = models.ActivityDetails.getActivitySubtitle1(ancestorPath);
    msgInfo.subtitle2 = models.ActivityDetails.getActivitySubtitle2(ancestorPath);
    msgInfo.actionType = details.getExpectedAction();
    msgInfo.userImageUrl = pu._str(activityInfo.owner.image_url, "/assets/images/activities/noimage.jpg");
    msgInfo.ownerFullName = activityInfo.owner.full_name;
    msgInfo.activityDate = details.activity_time;
    msgInfo.comments = details.comments;
    msgInfo.actionUrl = details.getEntityUrl();

    return msgInfo;
}

export {
    createTeamsMessageCard,
    createO365MessageCard,
    createMessageInfo,
    events,
}