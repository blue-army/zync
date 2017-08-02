import * as models from "../models/models"
import * as pu from '../utils/prop-utils';

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

function createMessageInfo(info: models.EventInfo): models.MessageInfo {

    let msgInfo = new models.MessageInfo();
    let activityInfo = models.ActivityInfo.fromObj(info.content);
    let details = activityInfo.activity;

    let ancestorPath = details.getAncestorPath();
    msgInfo.id = info.id;
    msgInfo.typeImageUrl = details.getEntityImageUrl();
    msgInfo.entityName = details.entity_name;
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
    createMessageInfo,
}