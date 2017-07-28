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
    }
];

exports.events = events;