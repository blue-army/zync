
class ProjectInfo {
    id: string;
    name: string;
    channels: ChannelInfo[];

    public toObj(): any {
        let props = ['id', 'name', 'channels'];
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
            throw new Error('missing task id');
        }

        let o = new ProjectInfo();
        o.id = j['id'];
        o.name = j['name'];

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

export {
    ProjectInfo,
    ChannelInfo,
}