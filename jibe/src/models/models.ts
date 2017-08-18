import * as _ from 'lodash';
import * as botbuilder from 'botbuilder';

class ProjectInfo {
    id: string;
    name: string;
    source: string;
    geohash: string;
    channels: ChannelInfo[];
    routes: RouteInfo[];
    group: string;

    public toObj(): any {
        let props = ['id', 'name', 'source', 'geohash', 'channels', 'routes', 'group'];
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
            throw new Error('missing id');
        }

        let o = new ProjectInfo();
        o.id = j['id'];
        o.name = j['name'];
        o.source = j['source'];
        o.geohash = j['geohash'];

        // channels
        o.channels = [];
        for (let c of _.get(j, 'channels', [])) {
            o.channels.push(ChannelInfo.fromObj(c));
        }

        // routes
        o.routes = [];
        for (let r of _.get(j, 'routes', [])) {
            o.routes.push(RouteInfo.fromObj(r));
        }

        // group
        o.group = j['group'];

        return o;
    }
}

class RouteInfo {
    path: string;
    expr: string;
    webhook: string;
    channelId: string;

    public static fromObj(j: any): RouteInfo {
        let o = new RouteInfo();

        o.path = j['path'];
        o.expr = j['expr'];
        o.webhook = j['webhook'];
        o.channelId = j['channelId'];

        return o;
    }
}

class GroupInfo {
    id: string;
    name: string;
    description: string;

    public static fromObj(j: any): GroupInfo {
        let o = new GroupInfo();

        o.id = j['id'];
        o.name = j['displayName'];
        o.description = j['description'];

        return o;
    }
}

class GraphChannelInfo {
    name: string;
    id: string;
    description: string;

    public static fromObj(j: any): GraphChannelInfo {
        let o = new GraphChannelInfo();
        o.name = j['displayName'];
        o.id = j['id'];
        o.description = j['description'];
        return o;
    }
}

class ChannelInfo {
    name: string;
    id: string;
    webhook: string;
    botaddress: botbuilder.IAddress;

    public static fromObj(j: any): ChannelInfo {
        let o = new ChannelInfo();

        o.name = j['name'];
        o.id = j['id'];
        o.webhook = j['webhook'];
        o.botaddress = j['botaddress']

        return o;
    }
}

class EventInfo {
    id: string;
    project: string;
    type: string;
    content: object;

    [key: string]: any;

    public static fromObj(j: any): EventInfo {
        let o = new EventInfo();

        o.id = j['id'];
        o.type = j['type'];
        o.project = j['project'];
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

        var activityTypeToAction: any = {
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

    public getEntityImageUrl(): string {

        var iconMap: any = {
            'activity plan': 'composer',
            'bha&drillstring': 'bha_drilling_string_1',
            'bit selection': 'bit_selection',
            'bit': 'bit_selection',
            'casing design': 'casing_design',
            'define cement job': 'cementing',
            'define drilling fluid': 'drilling_fluid_task',
            'define formation temperature': 'temperature_task',
            'define fracture pressure': 'fracture_pressure_task',
            'define pore pressure': 'pore_pressure_task',
            'define rig': 'rig_task',
            'define surface location': 'surface_location_task',
            'define target': 'target_task',
            'define wellhead and bop': 'wellhead_bop',
            'design bha&drillstring': 'bha_drillstring_design',
            'design casing': 'casing_design_task',
            'design mud': 'drilling_fluid_task',
            'design trajectory': 'traj_design',
            'design wellbore geometry': 'wellbore_geometry_task',
            'drilling fluid': 'drilling_fluid_1',
            'drilling parameter': 'drilling_parameters',
            'evaluation': 'evaluation',
            'formation tops': 'formation_tops',
            'fracture pressure': 'fracture_pressure',
            'iar request': 'iar',
            'itpreport': 'report',
            'jar placement': 'risks_1',
            'place jar': 'place_jar_task',
            'pore pressure': 'pore_pressure',
            'prepare afe': 'afe_1',
            'project': 'project_1',
            'rig': 'rig',
            'risks': 'risks_1',
            'riskset': 'risk',
            'section': 'well_information_1',
            'select bit': 'bit_selection',
            'surface location': 'surface_location_1',
            'target': 'target_1',
            'temperature': 'temperature',
            'trajectory': 'trajectory_1',
            'well': 'well_information_1',
            'wellbore geometry': 'wellbore_geometry',
        };

        var iconImageName = iconMap[this.activity_entity_type.toLowerCase()];
        if (!iconImageName) {
            iconImageName = 'unknown';
        }

        var baseURI: string = process.env.BASE_URI || "https://jibe.azurewebsites.net";
        return baseURI + '/assets/images/activities/' + iconImageName + '.png';
    }

    public getEntityUrl(): string {

        let host = "https://drillplan.demo.slb.com";

        // extract information
        let info = new Map<string, string>();
        info.set('entity', this.entity_id);
        let parent = this.parent;
        while (parent !== null) {
            info.set(parent.entity_type, parent.id);
            parent = parent.parent;
        }

        return host + NavigationService.getUrl(this, info);
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

class NavigationService {

    public static getUrl(details: ActivityDetails, info: Map<string, string>): string {

        let url = "";
        switch (details.activity_entity_type.toLowerCase()) {
            case 'trajectory':
                if (details.is_customer_data) {
                    url = NavigationService.customerDataUrl(info.get('project'), undefined) + '/trajectories/' + info.get('entity') + '/edit';
                } else {
                    url = NavigationService.trajUrl(info.get('project')) + '/plans/' + info.get('entity');
                }
                break;
            case 'rig':
                url = NavigationService.customerDataUrl(info.get('project'), undefined) + '/rig';
                break;
            case 'project':
                url = NavigationService.projectUrl(details.project_id);
                break;
            case 'risks':
                url = NavigationService.risksUrl(info.get('project'));
                break;
            case 'wellbore geometry':
                url = NavigationService.customerDataUrl(info.get('project'), undefined) + '/wbg/' + info.get('entity');
                break;
            case 'surface location':
                url = NavigationService.customerDataUrl(info.get('project'), undefined) + '/surfacelocation/' + info.get('entity');
                break;
            case 'target':
                url = NavigationService.customerDataUrl(info.get('project'), undefined) + '/targets/' + info.get('entity');
                break;
            case 'bha&drillstring':
                url = NavigationService.bhaUrl(info.get('project'), info.get('section')) + '/bhadesign/' + info.get('entity') + '/edit';
                break;
            case 'drilling parameter':
                url = NavigationService.drillingParamUrl(info.get('project'), info.get('section'), info.get('run')) + '/drillingparam/' + info.get('entity') + '/edit';
                break;
            case 'drilling fluid':
                url = NavigationService.drillingFluidUrl(info.get('project'), info.get('section'), info.get('entity')); // + '/mud/' + info.get('entity');
                break;
            case 'bit':
                url = NavigationService.bitUrl(info.get('project'));
                break;
            case 'section':
                url = NavigationService.sectionUrl(info.get('project'));
                break;
            default:
                break;
        }

        return url;
    }

    public static customerDataUrl(projectId: string, sectionId: string) {
        var url = '/CustomerData/#!/projects/' + projectId;
        if (sectionId) {
            url += '/sections/' + sectionId;
        }
        return url;
    }

    public static projectUrl(projectId: string) {
        return '/Projects/#!/projects/' + projectId;
    }

    public static risksUrl(projectId: string) {
        return '/Risks/index.html#!/projects/' + projectId;
    }

    public static trajUrl(projectId: string) {
        return '/Traj/#!/projects/' + projectId;
    }

    public static bitUrl(projectId: string) {
        return '/TaskManager/#!/projects/' + projectId + '/sections';
    }

    public static bhaUrl(projectId: string, sectionId: string) {
        return '/BhaBuilder/index.html#!/projects/' + projectId + '/sections/' + sectionId;
    }

    public static drillingParamUrl(projectId: string, sectionId: string, runId: string) {
        return '/BhaBuilder/index.html#!/projects/' + projectId + '/sections/' + sectionId + '/runs/' + runId;
    }

    public static sectionUrl(projectId: string) {
        return '/TaskManager/#!/projects/' + projectId + '/sections';
    }

    public static drillingFluidUrl(projectId: string, sectionId: string, entityId: string) {
        return '/DrillingFluid/index.html#!/projects/' + projectId + '/sections/' + sectionId + '/generic/' + entityId;
    }
}

class MessageInfo {
    id: string;
    entityName: string;
    activityEntityType: string;
    subtitle1: string;
    subtitle2: string;
    actionType: string;
    ownerFullName: string;
    comments: string;
    typeImageUrl: string;
    userImageUrl: string;
    activityDate: string;
    actionUrl: string;
}

class LoginInfo {
    resource_id: string;
    client_id: string;
    client_secret: string;

    public static fromObj(j: any): LoginInfo {
        let o = new LoginInfo();

        o.resource_id = _.get(j, 'resource_id', '');
        o.client_id = j['client_id'];
        o.client_secret = j['client_secret'];

        return o;
    }
}

class AppInfo {
    name: string;
    prefix: string;
    id: string;

    public static fromObj(j: any): AppInfo {
        let o = new AppInfo;

        o.name = j['name'];
        o.prefix = j['prefix'];
        o.id = j['id'];

        return o;
    }
}


export {
    ProjectInfo,
    ChannelInfo,
    EventInfo,
    EntityChangedEventInfo,
    DrillPlanActivityCardInfo,
    ActivityInfo,
    ActivityDetails,
    MessageInfo,
    LoginInfo,
    GroupInfo,
    GraphChannelInfo,
    RouteInfo,
    AppInfo
}