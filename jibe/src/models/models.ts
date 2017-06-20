import * as _ from 'lodash';

class ProjectInfo {
    id: string;
    name: string;
    source: string;
    geohash: string;
    channels: ChannelInfo[];

    public toObj(): any {
        let props = ['id', 'name', 'source', 'geohash', 'channels'];
        var me = <any>(this);

        let obj = [];
        for (let prop of props) {
            if (!me[prop]) {
                continue;
            }

            obj.push({
                name: prop,
                value: me[prop],
            });
        }

        return obj;
    }

    public static fromObj(j: any): ProjectInfo {

        // normalize
        if (!j['channels']) {
            j['channels'] = [];
        }

        if (!j['id']) {
            throw new Error('missing id');
        }

        let o = new ProjectInfo();
        o.id = j['id'];
        o.name = j['name'];
        o.source = j['source'];
        o.geohash = j['geohash'];

        // channels
        o.channels = [];
        for (let c of j['channels']) {
            o.channels.push(ChannelInfo.fromObj(c));
        }

        return o;
    }
}

class ChannelInfo {
    name: string;
    webhook: string;

    public static fromObj(j: any): ChannelInfo {
        let o = new ChannelInfo();

        o.name = j['name'];
        o.webhook = j['webhook'];

        return o;
    }
}

class EventInfo {
    type: string;
    content: object;

    public static fromObj(j: any): EventInfo {
        let o = new EventInfo();

        o.type = j['type'];
        o.content = j['content'];

        return o;
    }
}

class EntityChangedEventInfo {
    entity: string;
    property: string;
    from: any;
    to: any;

    public static fromObj(j: any): EntityChangedEventInfo {
        let o = new EntityChangedEventInfo();

        o.entity = j['entity'];
        o.property = j['property'];
        o.from = j['from'];
        o.to = j['to'];

        return o;
    }
}



/*    
{
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",    
    "title": " ",
    "summary": " ",
    "themeColor": "0078D7",
    "sections": [
        {
            "startGroup": true,
            "activityTitle": "Mud Design Changed",
            "activitySubtitle": "Density",
            "activityImage": "http://icons.iconarchive.com/icons/rokey/fantastic-dream/128/driver-mud-icon.png"
        },
        {
            "startGroup": true,
            "facts": [
                {
                    "name": "From",
                    "value": "1.3"
                },
                {
                    "name": "To",
                    "value": "0.9"
                },
                {
                    "name": "User",
                    "value": "adele"
                }
            ]
        }
    ],
    "potentialAction": [
        {
            "@context": "http://schema.org",
            "@type": "ViewAction",
            "name": "Launch Application",
            "target": [
                "http://163.185.149.206/#/wpm/programs"
            ]
        }
    ]
}
*/

class ActivityInfo {
    id: string;
    owner: PersonInfo;
    activity: ActivityDetails;

    public static fromObj(obj: object) {

        let o = new ActivityInfo();
        o.id = _.get<Object, string>(obj, 'id', '');
        o.owner = PersonInfo.fromObj(_.get<Object, Object>(obj, 'owner', {}));
        o.activity = ActivityDetails.fromObj(_.get<Object, Object>(obj, 'activity', {}));

        return o;
    }
}

class PersonInfo {
    full_name: string;
    image_url: string;

    public static fromObj(obj: object): PersonInfo {
        let o = new PersonInfo();
        o.full_name = _.get<Object, string>(obj, 'full_name', '');
        o.image_url = _.get<Object, string>(obj, 'image_url', '');
        return o;
    }
}

class ActivityDetails {
    type: string;
    entity_id: string;
    entity_name: string;
    activity_time: string;
    comments: string;
    project_id: string;
    activity_entity_type: string;
    is_customer_data: boolean;
    changed_property_names: Array<object>;
    extension_propertys_dic: Map<string, string>;
    parent: ParentInfo;

    public static fromObj(obj: object): ActivityDetails {
        if (obj === null) {
            return null;
        }

        let o = new ActivityDetails();
        o.type = _.get<Object, string>(obj, 'type', '');
        o.entity_id = _.get<Object, string>(obj, 'entity_id', '');
        o.entity_name = _.get<Object, string>(obj, 'entity_name', '');
        o.activity_time = _.get<Object, string>(obj, 'activity_time', '');
        o.comments = _.get<Object, string>(obj, 'comments', '');
        o.project_id = _.get<Object, string>(obj, 'project_id', '');
        o.activity_entity_type = _.get<Object, string>(obj, 'activity_entity_type', '');
        o.is_customer_data = _.get<Object, boolean>(obj, 'id', false);
        o.parent = ParentInfo.fromObj(_.get<Object, Object>(obj, 'parent', null));
        return o;
    }

    public getAncestorPath(): string {

        let path = "";

        // traverse parent hierarchy
        let parent = this.parent;
        while (parent !== null) {

            let base = parent.name;
            if (path.length !== 0) {
                base += "/";
            }
            path = base + path;

            // navigate
            parent = parent.parent;
        }


        return path;
    }

    public static getActivitySubtitle1(ancestorPath: string): string {
        var title = ancestorPath;
        if (ancestorPath) {
            var indexOf = ancestorPath.indexOf('/');
            if (indexOf > 0) {
                title = ancestorPath.substring(0, indexOf);
            }
        }
        return title;
    }

    public static getActivitySubtitle2(ancestorPath: string): string {
        var title = '';
        if (ancestorPath) {
            var indexOf = ancestorPath.indexOf('/');
            if (indexOf > 0) {
                title = ancestorPath.substring(indexOf + 1, ancestorPath.length);
            }
        }
        return title;
    }

    public getExpectedAction(): string {

        var activityTypeToAction:any = {
            'Share': 'Shared',
            'Create': 'Added',
            'Update': 'Changed',
            'JoinProject': 'Joined',
            'LeaveProject': 'Unjoined',
            'PickTask': 'Owned',
            'GenerateReport': 'Generated'
        };

        var activityAction = activityTypeToAction[this.type] || this.type;
        if (this.activity_entity_type === 'project' && this.type === 'Create') {
            activityAction = 'Created';
        }
        return activityAction + ' by';
    }

}

class ParentInfo {
    id: string;
    entity_type: string;
    name: string;
    parent: ParentInfo;

    public static fromObj(obj: object): ParentInfo {
        if (obj === null) {
            return null;
        }

        let o = new ParentInfo();
        o.id = _.get<Object, string>(obj, 'id', '');
        o.entity_type = _.get<Object, string>(obj, 'entity_type', '');
        o.name = _.get<Object, string>(obj, 'name', '');
        o.parent = ParentInfo.fromObj(_.get<Object, Object>(obj, 'parent', {}));
        return o;
    }
}


class DrillPlanActivityCardInfo {
    id: string;
    title: string;
    subtitle1: string;
    subtitle2: string;
    image_url: string;
    activity_type: string;
    user: string;
    user_picture: string;
    launch: string;
    comments: string;

    public static fromObj(raw: any): DrillPlanActivityCardInfo {

        let info: ActivityInfo = raw as ActivityInfo;

        let o: DrillPlanActivityCardInfo = new DrillPlanActivityCardInfo();
        o.id = info.id;
        o.title = info.activity.entity_name;
        o.subtitle1 = info.activity.entity_name;
        o.subtitle2 = info.activity.entity_name;
        o.user = info.owner.full_name;
        o.activity_type = info.activity.type;
        o.comments = info.activity.comments;

        return o;
    }
}

//////////////////// Begin - Team Card ////////////////////

class PropertyChangedEventInfo {
    title: string;                      // " "
    summary: string;                    // " "
    themeColor: string;                 // "0078D7"
    sections: SectionInfo[];
    actions: ActionInfo[];

    constructor() {
        this.title = " ";
        this.summary = " ";
        this.themeColor = "0078D7";
        this.sections = [];
        this.actions = [];
    }

    public ToObj(): any {
        let o: any = {};

        o['@type'] = "MessageCard";
        o['@context'] = "http://schema.org/extensions";

        let me = <any>(this);
        for (let prop of ['title', 'summary', 'themeColor']) {
            o[prop] = me[prop];
        }

        let sections: any = [];
        for (let s of this.sections) {
            sections.push(s.ToObj());
        }
        o['sections'] = sections;

        let actions: any = [];
        for (let a of this.actions) {
            actions.push(a.ToObj());
        }
        o['potentialAction'] = actions;

        return o;
    }
}

class SectionInfo {
    startGroup: boolean;
    activityTitle: string;      // "Mud Design Changed",
    activitySubtitle: string;   // "Density",
    activityText: string;
    activityImage: string;      // "http://icons.iconarchive.com/icons/rokey/fantastic-dream/128/driver-mud-icon.png"
    facts: Map<string, string>;

    public ToObj(): any {
        let o: any = {};

        // normalize
        if (!this.facts) {
            this.facts = new Map();
        }

        let me = <any>(this);
        for (let prop of ['startGroup', 'activityTitle', 'activitySubtitle', 'activityImage', 'activityText']) {
            o[prop] = me[prop];
        }

        let facts: any = [];
        for (let fkey of this.facts.keys()) {
            facts.push({
                'name': fkey,
                'value': this.facts.get(fkey),
            });
        }
        o['facts'] = facts;

        return o;
    }

    public static CreateActivityCard(image: string, title: string, subtitle: string, text: string, start: boolean) {
        let s = new SectionInfo();
        s.startGroup = start;
        s.activityTitle = title;
        s.activitySubtitle = subtitle;
        s.activityImage = image;
        s.activityText = text;
        return s;
    }

    public static CreateFactCard(start: boolean, facts: Map<string, string>) {
        let s = new SectionInfo();
        s.startGroup = start;
        s.facts = facts;
        return s;
    }
}

class ActionInfo {
    name: string;               // "Launch Application",
    target: string;           // ["http://163.185.149.206/#/wpm/programs"]

    constructor(name: string, target: string) {
        this.name = name;
        this.target = target;
    }

    public ToObj(): any {
        let o: any = {};

        o['@type'] = "ViewAction";
        o['@context'] = "http://schema.org";
        o['name'] = this.name;
        o['target'] = new Array(this.target);

        return o;
    }
}

//////////////////// End - Team Card ////////////////////

export {
    ProjectInfo,
    ChannelInfo,
    EventInfo,
    PropertyChangedEventInfo,
    SectionInfo,
    ActionInfo,
    EntityChangedEventInfo,
    DrillPlanActivityCardInfo,
    ActivityInfo,
    ActivityDetails
}