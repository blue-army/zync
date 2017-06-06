
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

        if (!j['id']) {
            throw new Error('missing task id');
        }

        let o = new ProjectInfo();
        o.id = j['id'];
        o.name = j['name'];

        return o;
    }
}

class ChannelInfo {
    name: string;
    

    public static fromJSON(j: any): ChannelInfo {
        let o = new ChannelInfo();
        o.name = j['name'];
        return o;
    }
}

export {
    ProjectInfo,
    ChannelInfo,
}