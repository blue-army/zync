import * as models from "../models/models"
import * as pu from '../utils/prop-utils';

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
    },
    {
        "name": "Wellbore Geometry",
        "rule": {
            "path": "activity.activity_entity_type",
            "expr": "^wellbore geometry$",
        }
    }
];


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
    createMessageInfo,
    events,
}