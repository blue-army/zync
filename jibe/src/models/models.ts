

class ProjectInfo {
    id: string;
    name: string;
    source: string;
    channels: ChannelInfo[];

    public toObj(): any {
        let props = ['id', 'name', 'source', 'channels'];
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
    content: string;

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
    activityImage: string;      // "http://icons.iconarchive.com/icons/rokey/fantastic-dream/128/driver-mud-icon.png"
    facts: Map<string, string>;

    public ToObj(): any {
        let o: any = {};

        // normalize
        if (!this.facts) {
            this.facts = new Map();
        }

        let me = <any>(this);
        for (let prop of ['startGroup', 'activityTitle', 'activitySubtitle', 'activityImage']) {
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

    public static CreateActivityCard(start: boolean, title: string, subtitle: string, image: string) {
        let s = new SectionInfo();
        s.startGroup = start;
        s.activityTitle = title;
        s.activitySubtitle = subtitle;
        s.activityImage = image;
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

export {
    ProjectInfo,
    ChannelInfo,
    EventInfo,
    PropertyChangedEventInfo,
    SectionInfo,
    ActionInfo,
    EntityChangedEventInfo,
}