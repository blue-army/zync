import { Event } from '_debugger';

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

export {
    ProjectInfo,
    ChannelInfo,
    EventInfo,
}