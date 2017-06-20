namespace Slb.TaiJi.Framework.Service.Data
{
    public static class ActivityType
    {
        public const string Create = "Create";
        public const string Share = "Share";
        public const string Fetch = "Fetch";
        public const string Update = "Update";
        public const string Delete = "Delete";
        public const string JoinProject = "JoinProject";
        public const string LeaveProject = "LeaveProject";
        public const string PickTask = "PickTask";
        public const string GenerateReport = "GenerateReport";
    }
}

namespace Slb.TaiJi.Framework.Service.Data
{
    public static class ActivityEntityType
    {
        public const string Project = "project";
        public const string BHA = "BHA&Drillstring";
        public const string Traj = "trajectory";
        public const string Section = "section";
        public const string DrillStringRunSelection = "run";
        public const string Task = "task";
        public const string RigUsage = "rig";
        public const string WellboreGeometry = "wellbore geometry";
        public const string DrillingFluid = "drilling fluid";
        public const string Target = "target";
        public const string Iaxx = "IAR Request";
        public const string Bit = "bit";
        public const string BitSelection = "Bit Selection";
        public const string SurfaceLocation = "Surface Location";
        public const string DrillingParameter = "Drilling Parameter";
        public const string FracturePressure = "Fracture Pressure";
        public const string PorePressure = "Pore Pressure";
        public const string Temperature = "Formation Temperature";
        public const string FormationTops = "Formation Tops";
        public const string JarPlacement = "jar placement";
        public const string RiskSet = "risks";
        public const string Risk = "risk";
        public const string Evaluation = "evaluation";
        public const string Cementing = "define cement job";
        public const string WellheadAndBOP = "Define Wellhead and BOP";
    }
}


namespace Slb.TaiJi.Framework.Service.Data.DTO
{
    [DataContract]
    public class ActivityLogDto
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        [JsonProperty(PropertyName = "owner")]
        public OwnerDto Owner { get; set; }

        [JsonProperty(PropertyName = "activity")]
        public ActivityDto Activity { get; set; }
    }

    [DataContract]
    public class OwnerDto
    {
        [JsonProperty(PropertyName = "full_name")]
        public string FullName { get; set; }

        [JsonProperty(PropertyName = "image_url")]
        public string ImageUrl { get; set; }
    }

    [DataContract]
    public class ActivityDto
    {
        [JsonProperty(PropertyName = "type")]
        public string Type { get; set; }

        [JsonProperty(PropertyName = "entity_id")]
        public string EntityId { get; set; }

        [JsonProperty(PropertyName = "entity_name")]
        public string EntityName { get; set; }

        [JsonProperty(PropertyName = "activity_time")]
        public DateTime ActivityTime { get; set; }

        [JsonProperty(PropertyName = "comments")]
        public string Comments { get; set; }

        [JsonProperty(PropertyName = "project_id")]
        public string ProjectId { get; set; }

        [JsonProperty(PropertyName = "activity_entity_type")]
        public string ActivityEntityType { get; set; }

        [JsonProperty(PropertyName = "is_customer_data")]
        public bool IsCustomerData { get; set; }

        /// <summary>
        /// The names of the properties (of the entity identified by EntityId) that are
        /// changed during the activity.  Usually, these are recorded only during
        /// Update activities.
        /// </summary>
        [JsonProperty(PropertyName = "changed_property_names")]
        public IEnumerable<string> ChangedPropertyNames { get; set; }

        [SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly", Justification = "Property is used for serialization")]
        [JsonProperty(PropertyName = "extension_propertys_dic")]
        public Dictionary<string, string> ExtensionPropertysDic { get; set; }

        /// <summary>
        /// The primary parent (in the data model) of the entity identified by EntityId
        /// </summary>
        [JsonProperty(PropertyName = "parent")]
        public ActivityLogParentDto Parent { get; set; }
    }

    [DataContract]
    public class ActivityLogParentDto
    {
        /// <summary>
        /// The ID of the ancestor
        /// </summary>
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        /// <summary>
        /// The entity type of the ancestor (e.g., "project", "section", etc).
        /// </summary>
        [JsonProperty(PropertyName = "entity_type")]
        public string EntityType { get; set; }

        /// <summary>
        /// The name of the ancestor
        /// </summary>
        [JsonProperty(PropertyName = "name")]
        public string Name { get; set; }

        /// <summary>
        /// The primary parent of the current parent
        /// </summary>
        [JsonProperty(PropertyName = "parent")]
        public ActivityLogParentDto Parent { get; set; }
    }
}

  function IconService() {
        var iconMap = {
            'riskset': 'tj_icon_risk',
            'itpreport': 'tj_icon_report',
            'project': 'tj_icon_project',
            'bha&drillstring': 'tj_icon_bha_drilling_string',
            'trajectory': 'tj_icon_trajectory',
            'formation tops': 'tj_icon_formation_tops',
            'wellbore geometry': 'tj_icon_wellbore_geometry',
            'drilling fluid': 'tj_icon_drilling_fluid',
            'drilling parameter': 'tj_icon_drilling_parameters',
            'select bit': 'tj_icon_bit_selection',
            'bit selection': 'tj_icon_bit_selection',
            'bit': 'tj_icon_bit_selection',
            'rig': 'tj_icon_rig',
            'surface location': 'tj_icon_surface_location',
            'target': 'tj_icon_target',
            'design bha&drillstring': 'tj_icon_bha_drillstring_design',
            'design trajectory': 'tj_icon_traj_design',
            'risks': 'tj_icon_risks',
            'jar placement': 'tj_icon_risks',
            'place jar': 'tj_icon_place_jar_task',
            'well': 'tj_icon_well_information',
            'section': 'tj_icon_well_information',
            'define fracture pressure': 'tj_icon_fracture_pressure_task',
            'define pore pressure': 'tj_icon_pore_pressure_task',
            'define formation temperature': 'tj_icon_temperature_task',
            'define target': 'tj_icon_target_task',
            'define surface location': 'tj_icon_surface_location_task',
            'design wellbore geometry': 'tj_icon_wellbore_geometry_task',
            'define rig': 'tj_icon_rig_task',
            'define drilling fluid': 'tj_icon_drilling_fluid_task',
            'design mud': 'tj_icon_drilling_fluid_task',
            'casing design': 'tj_icon_casing_design',
            'design casing': 'tj_icon_casing_design_task',
            'fracture pressure': 'tj_icon_fracture_pressure',
            'pore pressure': 'tj_icon_pore_pressure',
            'temperature': 'tj_icon_temperature',
            'iar request': 'tj_icon_iar',
            'activity plan': 'tj_icon_composer',
            'evaluation': 'tj_icon_evaluation',
            'prepare afe': 'tj_icon_afe',
            'define cement job': 'tj_icon_cementing',
            'define wellhead and bop': 'tj_icon_wellhead_bop'
        };

        function getExpectedAction(activityLog) {
        var activityTypeToAction = {
            'Share': 'Shared',
            'Create': 'Added',
            'Update': 'Changed',
            'JoinProject': 'Joined',
            'LeaveProject': 'Unjoined',
            'PickTask': 'Owned',
            'GenerateReport': 'Generated'
        };

        var activityAction = activityTypeToAction[activityLog.activity.type] || activityLog.activity.type;
        if (activityLog.activity.activity_entity_type === 'project' && activityLog.activity.type === 'Create') {
            activityAction = 'Created';
        }
        return activityAction;
    }