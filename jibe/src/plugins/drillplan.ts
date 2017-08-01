import * as models from "../models/models"

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

export {
    createTeamsMessageCard,
}