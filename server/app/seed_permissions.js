process.env.VUE_APP_DB_HOST = 'localhost';
process.env.VUE_APP_USER = 'postgres';
process.env.VUE_APP_PASSWORD = '***REDACTED***';
process.env.VUE_APP_DB = 'kisip';
process.env.VUE_APP_DB_PORT = '5432';

console.log('Starting permission seeding process...');
console.log('DB ENV:', process.env.VUE_APP_DB_HOST, process.env.VUE_APP_USER, process.env.VUE_APP_PASSWORD, process.env.VUE_APP_DB, process.env.VUE_APP_DB_PORT);

const db = require('./models');

async function seedPermissions() {
  try {
    console.log('Syncing database...');
    await db.sequelize.sync(); // Ensure tables exist
    console.log('Database synced successfully');

    // Create root_admin and super_admin roles if they don't exist
    const roles = [
      { name: 'root_admin', description: 'Full system access including logs' },
      { name: 'super_admin', description: 'Full admin access except system logs' }
    ];

    console.log('Creating roles...');
    for (const role of roles) {
      const [createdRole, created] = await db.role.findOrCreate({
        where: { name: role.name },
        defaults: role
      });
      if (created) {
        console.log(`Created role: ${role.name}`);
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
    }
    console.log('Roles created/verified');

    // Expanded permissions for all major resources and actions
    const permissions = [
      // Roles Model Permissions
      { name: 'roles:create', description: 'Create roles' },
      { name: 'roles:read', description: 'Read roles' },
      { name: 'roles:update', description: 'Update roles' },
      { name: 'roles:delete', description: 'Delete roles' },
      { name: 'roles:manage', description: 'Manage roles' },
      { name: 'roles:assign', description: 'Assign roles to users' },

      // System
      { name: 'system:all', description: 'Full system access' },
      { name: 'admin:all', description: 'Full admin access' },

      // Users
      { name: 'user:create', description: 'Create users' },
      { name: 'user:read', description: 'Read user data' },
      { name: 'user:update', description: 'Update users' },
      { name: 'user:delete', description: 'Delete users' },
      { name: 'user:activate', description: 'Activate users' },
      { name: 'user:deactivate', description: 'Deactivate users' },
      { name: 'user:assignRole', description: 'Assign roles to users' },

      // Projects
      { name: 'project:create', description: 'Create projects' },
      { name: 'project:read', description: 'Read projects' },
      { name: 'project:update', description: 'Update projects' },
      { name: 'project:delete', description: 'Delete projects' },

      // Settlements
      { name: 'settlement:create', description: 'Create settlements' },
      { name: 'settlement:read', description: 'Read settlements and details' },
      { name: 'settlement:update', description: 'Update settlements' },
      { name: 'settlement:delete', description: 'Delete settlements' },
      { name: 'settlement:uploadDocument', description: 'Upload documents to a settlement' },
      { name: 'settlement:deleteDocument', description: 'Delete documents from a settlement' },
      { name: 'settlement:mergeDuplicates', description: 'Merge duplicate settlements' },
      { name: 'settlement:findDuplicates', description: 'Find duplicate settlements' },
      { name: 'settlement:revertHistory', description: 'Revert settlement history' },
      { name: 'settlement:import', description: 'Import settlements in bulk' },
      { name: 'settlement:export', description: 'Export settlements' },
      { name: 'settlement:viewDeleted', description: 'View deleted settlements' },
      { name: 'settlement:restore', description: 'Restore deleted settlements' },
      { name: 'settlement:viewMap', description: 'View settlements on map' },
      { name: 'settlement:editMap', description: 'Edit settlement spatial data' },

      // Settlement Permissions
      { name: 'settlement:view_map', description: 'View settlement on map' },
      { name: 'settlement:edit_map', description: 'Edit settlement on map' },
      { name: 'settlement:merge', description: 'Merge settlements' },
      { name: 'settlement:split', description: 'Split settlements' },
      { name: 'settlement:archive', description: 'Archive settlements' },
      { name: 'settlement:restore', description: 'Restore archived settlements' },
      { name: 'settlement:verify', description: 'Verify settlement data' },
      { name: 'settlement:approve', description: 'Approve settlement changes' },
      { name: 'settlement:reject', description: 'Reject settlement changes' },
      { name: 'settlement:history', description: 'View settlement history' },
      { name: 'settlement:export_data', description: 'Export settlement data' },
      { name: 'settlement:import_data', description: 'Import settlement data' },

      // Settlement History Permissions
      { name: 'settlement_history:create', description: 'Create settlement history entry' },
      { name: 'settlement_history:read', description: 'View settlement history entries' },
      { name: 'settlement_history:update', description: 'Update settlement history entries' },
      { name: 'settlement_history:delete', description: 'Delete settlement history entries' },
      { name: 'settlement_history:restore', description: 'Restore settlement history entries' },
      { name: 'settlement_history:approve', description: 'Approve settlement history changes' },
      { name: 'settlement_history:reject', description: 'Reject settlement history changes' },
      { name: 'settlement_history:export', description: 'Export settlement history data' },

      // Households
      { name: 'household:create', description: 'Create households' },
      { name: 'household:read', description: 'Read households' },
      { name: 'household:update', description: 'Update households' },
      { name: 'household:delete', description: 'Delete households' },

      // Parcels
      { name: 'parcel:create', description: 'Create parcels' },
      { name: 'parcel:read', description: 'Read parcels' },
      { name: 'parcel:update', description: 'Update parcels' },
      { name: 'parcel:delete', description: 'Delete parcels' },

      // Facilities (education, health, public, other)
      { name: 'facility:create', description: 'Create facilities' },
      { name: 'facility:read', description: 'Read facilities' },
      { name: 'facility:update', description: 'Update facilities' },
      { name: 'facility:delete', description: 'Delete facilities' },

      // Feedback
      { name: 'feedback:read', description: 'Read feedback' },
      { name: 'feedback:action', description: 'Action on feedback' },

      // Documents
      { name: 'document:upload', description: 'Upload documents' },
      { name: 'document:delete', description: 'Delete documents' },
      { name: 'document:create', description: 'Create documents' },
      { name: 'document:read', description: 'Read documents' },
      { name: 'document:update', description: 'Update documents' },

      // Data Import/Export
      { name: 'data:import', description: 'Import data' },
      { name: 'data:export', description: 'Export data' },

      // GeoServer
      { name: 'geoserver:upload', description: 'Upload to GeoServer' },
      { name: 'geoserver:delete', description: 'Delete from GeoServer' },
      { name: 'geoserver:edit', description: 'Edit GeoServer layers' },

      // Collector
      { name: 'collector:read', description: 'Read collector data' },
      { name: 'collector:submit', description: 'Submit collector data' },
      { name: 'collector:delete', description: 'Delete collector data' },

      // Grievance (fine-grained)
      { name: 'grievance:create', description: 'File a new grievance' },
      { name: 'grievance:read', description: 'View grievances and details' },
      { name: 'grievance:update', description: 'Edit/update a grievance' },
      { name: 'grievance:updateBulk', description: 'Bulk update grievances' },
      { name: 'grievance:delete', description: 'Delete a grievance' },
      { name: 'grievance:escalate', description: 'Escalate a grievance' },
      { name: 'grievance:refer', description: 'Refer a grievance' },
      { name: 'grievance:resolve', description: 'Resolve a grievance' },
      { name: 'grievance:close', description: 'Close a grievance' },
      { name: 'grievance:reject', description: 'Reject a grievance' },
      { name: 'grievance:uploadDocument', description: 'Upload documents to a grievance' },
      { name: 'grievance:deleteDocument', description: 'Delete documents from a grievance' },
      { name: 'grievance:logAction', description: 'Log actions on a grievance' },
      { name: 'grievance:viewLog', description: 'View grievance logs/history' },
      { name: 'grievance:notify', description: 'Send notifications for a grievance' },
      { name: 'grievance:remind', description: 'Send reminders for a grievance' },
      { name: 'grievance:acknowledge', description: 'Acknowledge a grievance' },
      { name: 'grievance:import', description: 'Import grievances in bulk' },
      { name: 'grievance:export', description: 'Export grievances' },
      { name: 'grievance:viewDeleted', description: 'View deleted grievances' },
      { name: 'grievance:restore', description: 'Restore deleted grievances' },

      // GBV specific
      { name: 'gbv:create', description: 'Create GBV case' },
      { name: 'gbv:read', description: 'Read GBV cases' },
      { name: 'gbv:update', description: 'Update GBV cases' },
      { name: 'gbv:delete', description: 'Delete GBV cases' },
      { name: 'gbv:refer', description: 'Refer GBV cases' },

      // Dashboard, Reports, Admin
      { name: 'dashboard:view', description: 'View dashboard' },
      { name: 'report:export', description: 'Export reports' },
      { name: 'role:assign', description: 'Assign roles to users' },
      { name: 'permission:assign', description: 'Assign permissions to roles' },
      { name: 'admin:all', description: 'Full admin access' },
      { name: 'system:all', description: 'Full system access' },

      // Logs Module (root admin only)
      { name: 'logs:read', description: 'View system logs' },
      { name: 'logs:delete', description: 'Delete system logs' },
      { name: 'logs:export', description: 'Export system logs' },
      { name: 'logs:archive', description: 'Archive system logs' },
      { name: 'logs:purge', description: 'Purge system logs' },

      // Geographical Level Permissions
      { name: 'county:create', description: 'Create county' },
      { name: 'county:read', description: 'Read county data' },
      { name: 'county:update', description: 'Update county' },
      { name: 'county:delete', description: 'Delete county' },

      { name: 'subcounty:create', description: 'Create subcounty' },
      { name: 'subcounty:read', description: 'Read subcounty data' },
      { name: 'subcounty:update', description: 'Update subcounty' },
      { name: 'subcounty:delete', description: 'Delete subcounty' },

      { name: 'ward:create', description: 'Create ward' },
      { name: 'ward:read', description: 'Read ward data' },
      { name: 'ward:update', description: 'Update ward' },
      { name: 'ward:delete', description: 'Delete ward' },

      // Dashboard Component Permissions
      { name: 'dashboard_card:create', description: 'Create dashboard cards' },
      { name: 'dashboard_card:read', description: 'View dashboard cards' },
      { name: 'dashboard_card:update', description: 'Update dashboard cards' },
      { name: 'dashboard_card:delete', description: 'Delete dashboard cards' },

      { name: 'dashboard_section:create', description: 'Create dashboard sections' },
      { name: 'dashboard_section:read', description: 'View dashboard sections' },
      { name: 'dashboard_section:update', description: 'Update dashboard sections' },
      { name: 'dashboard_section:delete', description: 'Delete dashboard sections' },

      // Dashboard Section Chart Permissions
      { name: 'dashboard_section_chart:create', description: 'Create dashboard section charts' },
      { name: 'dashboard_section_chart:read', description: 'View dashboard section charts' },
      { name: 'dashboard_section_chart:update', description: 'Update dashboard section charts' },
      { name: 'dashboard_section_chart:delete', description: 'Delete dashboard section charts' },

      // Programme Implementation Permissions
      { name: 'programme_implementation:create', description: 'Create programme implementation' },
      { name: 'programme_implementation:read', description: 'Read programme implementation' },
      { name: 'programme_implementation:update', description: 'Update programme implementation' },
      { name: 'programme_implementation:delete', description: 'Delete programme implementation' },

      // Project Location Permissions
      { name: 'project_location:create', description: 'Create project location' },
      { name: 'project_location:read', description: 'Read project location' },
      { name: 'project_location:update', description: 'Update project location' },
      { name: 'project_location:delete', description: 'Delete project location' },

      // Beneficiary Permissions
      { name: 'beneficiary:create', description: 'Create beneficiaries' },
      { name: 'beneficiary:read', description: 'Read beneficiaries' },
      { name: 'beneficiary:update', description: 'Update beneficiaries' },
      { name: 'beneficiary:delete', description: 'Delete beneficiaries' },

      // OTP Permissions
      { name: 'otp:create', description: 'Create OTP' },
      { name: 'otp:read', description: 'Read OTP' },
      { name: 'otp:update', description: 'Update OTP' },
      { name: 'otp:delete', description: 'Delete OTP' },

      // Infrastructure Permissions
      { name: 'hazard_zone:manage', description: 'Manage hazard zones' },
      { name: 'community_hall:manage', description: 'Manage community halls' },
      { name: 'community_project:manage', description: 'Manage community projects' },
      { name: 'mast:manage', description: 'Manage masts' },
      { name: 'street_light:manage', description: 'Manage street lights' },
      { name: 'dumping_site:manage', description: 'Manage dumping sites' },
      { name: 'powerline:manage', description: 'Manage powerlines' },
      { name: 'railway:manage', description: 'Manage railways' },
      { name: 'floodlight:manage', description: 'Manage floodlights' },
      { name: 'crime_hotspot:manage', description: 'Manage crime hotspots' },
      { name: 'police_station:manage', description: 'Manage police stations' },

      // Type Management Permissions
      { name: 'facility_type:manage', description: 'Manage facility types' },
      { name: 'landuse_type:manage', description: 'Manage land use types' },
      { name: 'ownership_type:manage', description: 'Manage ownership types' },
      { name: 'settlement_type:manage', description: 'Manage settlement types' },
      { name: 'structure_type:manage', description: 'Manage structure types' },
      { name: 'document_type:manage', description: 'Manage document types' },
      { name: 'document_type:create', description: 'Create document types' },
      { name: 'document_type:read', description: 'Read document types' },
      { name: 'document_type:update', description: 'Update document types' },
      { name: 'document_type:delete', description: 'Delete document types' },
      { name: 'evaluation_type:manage', description: 'Manage evaluation types' },

      // Infrastructure Elements
      { name: 'path:manage', description: 'Manage paths' },
      { name: 'road:manage', description: 'Manage roads' },
      { name: 'sewer:manage', description: 'Manage sewers' },
      { name: 'stream:manage', description: 'Manage streams' },
      { name: 'piped_water:manage', description: 'Manage piped water' },

      // Facility Management
      { name: 'health_facility:manage', description: 'Manage health facilities' },
      { name: 'education_facility:manage', description: 'Manage education facilities' },
      { name: 'water_point:manage', description: 'Manage water points' },
      { name: 'road_asset:manage', description: 'Manage road assets' },
      { name: 'other_facility:manage', description: 'Manage other facilities' },

      // Project Components
      { name: 'component:manage', description: 'Manage components' },
      { name: 'domain:manage', description: 'Manage domains' },
      { name: 'project_category:manage', description: 'Manage project categories' },
      { name: 'project_menu:manage', description: 'Manage project menu' },
      { name: 'project_activity:manage', description: 'Manage project activities' },
      { name: 'project_contractor:manage', description: 'Manage project contractors' },
      { name: 'project_team:manage', description: 'Manage project teams' },
      { name: 'project_beneficiary:manage', description: 'Manage project beneficiaries' },
      { name: 'project_beneficiary:create', description: 'Create project beneficiaries' },
      { name: 'project_beneficiary:read', description: 'Read project beneficiaries' },
      { name: 'project_beneficiary:update', description: 'Update project beneficiaries' },
      { name: 'project_beneficiary:delete', description: 'Delete project beneficiaries' },

      // Evaluation & Indicators
      { name: 'evaluation:manage', description: 'Manage evaluations' },
      { name: 'evaluation:create', description: 'Create evaluations' },
      { name: 'evaluation:read', description: 'Read evaluations' },
      { name: 'evaluation:update', description: 'Update evaluations' },
      { name: 'evaluation:delete', description: 'Delete evaluations' },

      { name: 'evaluation_type:manage', description: 'Manage evaluation types' },
      { name: 'evaluation_type:create', description: 'Create evaluation types' },
      { name: 'evaluation_type:read', description: 'Read evaluation types' },
      { name: 'evaluation_type:update', description: 'Update evaluation types' },
      { name: 'evaluation_type:delete', description: 'Delete evaluation types' },

      { name: 'indicator:manage', description: 'Manage indicators' },
      { name: 'indicator:create', description: 'Create indicators' },
      { name: 'indicator:read', description: 'Read indicators' },
      { name: 'indicator:update', description: 'Update indicators' },
      { name: 'indicator:delete', description: 'Delete indicators' },
      { name: 'indicator_category:manage', description: 'Manage indicator categories' },
      { name: 'indicator_category:create', description: 'Create indicator categories' },
      { name: 'indicator_category:read', description: 'Read indicator categories' },
      { name: 'indicator_category:update', description: 'Update indicator categories' },
      { name: 'indicator_category:delete', description: 'Delete indicator categories' },
      { name: 'indicator_category_report:manage', description: 'Manage indicator category reports' },
      { name: 'chart_indicator:manage', description: 'Manage chart indicators' },

      // Document Management
      { name: 'document_category:manage', description: 'Manage document categories' },
      { name: 'document_category:create', description: 'Create document categories' },
      { name: 'document_category:read', description: 'Read document categories' },
      { name: 'document_category:update', description: 'Update document categories' },
      { name: 'document_category:delete', description: 'Delete document categories' },

      // Activity & Feedback
      { name: 'activity:manage', description: 'Manage activities' },
      { name: 'feedback:manage', description: 'Manage feedback' },

      // Programme Management
      { name: 'programme:manage', description: 'Manage programmes' },
      { name: 'frequency:manage', description: 'Manage frequencies' },
      { name: 'frequency:create', description: 'Create frequencies' },
      { name: 'frequency:read', description: 'Read frequencies' },
      { name: 'frequency:update', description: 'Update frequencies' },
      { name: 'frequency:delete', description: 'Delete frequencies' },
      { name: 'contractor:manage', description: 'Manage contractors' },
      { name: 'contractor:create', description: 'Create contractors' },
      { name: 'contractor:read', description: 'Read contractors' },
      { name: 'contractor:update', description: 'Update contractors' },
      { name: 'contractor:delete', description: 'Delete contractors' },

      // Grievance Management Extensions
      { name: 'grievance_resolution_level:manage', description: 'Manage grievance resolution levels' },
      { name: 'grievance_log:manage', description: 'Manage grievance logs' },
      { name: 'grievance_resolution:manage', description: 'Manage grievance resolutions' },
      { name: 'grievance_escalation:manage', description: 'Manage grievance escalations' },
      { name: 'grievance_document:manage', description: 'Manage grievance documents' },
      { name: 'grievance_notification:manage', description: 'Manage grievance notifications' },
      { name: 'grievance_history:manage', description: 'Manage grievance history' },

      // Articles
      { name: 'article:create', description: 'Create articles' },
      { name: 'article:read', description: 'Read articles' },
      { name: 'article:update', description: 'Update articles' },
      { name: 'article:delete', description: 'Delete articles' },

      // Disbursement
      { name: 'disbursement:create', description: 'Create disbursements' },
      { name: 'disbursement:read', description: 'Read disbursements' },
      { name: 'disbursement:update', description: 'Update disbursements' },
      { name: 'disbursement:delete', description: 'Delete disbursements' },

      // Cluster & Lots
      { name: 'cluster:manage', description: 'Manage clusters' },
      { name: 'lots:manage', description: 'Manage lots' },

      // Benefits
      { name: 'benefit_type:manage', description: 'Manage benefit types' },
      { name: 'settlement_status:manage', description: 'Manage settlement statuses' },

      // Streetlight Permissions
      { name: 'streetlight:create', description: 'Create streetlight' },
      { name: 'streetlight:read', description: 'Read streetlight data' },
      { name: 'streetlight:update', description: 'Update streetlight' },
      { name: 'streetlight:delete', description: 'Delete streetlight' },

      // Indicator Category Report Permissions
      { name: 'indicator_category_report:create', description: 'Create indicator category report' },
      { name: 'indicator_category_report:read', description: 'Read indicator category report' },
      { name: 'indicator_category_report:update', description: 'Update indicator category report' },
      { name: 'indicator_category_report:delete', description: 'Delete indicator category report' },

      // Structure Permissions
      { name: 'structure:create', description: 'Create structure' },
      { name: 'structure:read', description: 'Read structure data' },
      { name: 'structure:update', description: 'Update structure' },
      { name: 'structure:delete', description: 'Delete structure' },

      // Road Permissions
      { name: 'road:create', description: 'Create road' },
      { name: 'road:read', description: 'Read road data' },
      { name: 'road:update', description: 'Update road' },
      { name: 'road:delete', description: 'Delete road' },

      // Health Facility Permissions
      { name: 'health_facility:create', description: 'Create health facility' },
      { name: 'health_facility:read', description: 'Read health facility data' },
      { name: 'health_facility:update', description: 'Update health facility' },
      { name: 'health_facility:delete', description: 'Delete health facility' },

      // Education Facility Permissions
      { name: 'education_facility:create', description: 'Create education facility' },
      { name: 'education_facility:read', description: 'Read education facility data' },
      { name: 'education_facility:update', description: 'Update education facility' },
      { name: 'education_facility:delete', description: 'Delete education facility' },

      // Water Point Permissions
      { name: 'water_point:create', description: 'Create water point' },
      { name: 'water_point:read', description: 'Read water point data' },
      { name: 'water_point:update', description: 'Update water point' },
      { name: 'water_point:delete', description: 'Delete water point' },

      // Crime Hotspot Permissions
      { name: 'crime_hotspot:create', description: 'Create crime hotspot' },
      { name: 'crime_hotspot:read', description: 'Read crime hotspot data' },
      { name: 'crime_hotspot:update', description: 'Update crime hotspot' },
      { name: 'crime_hotspot:delete', description: 'Delete crime hotspot' },

      // Dumping Site Permissions
      { name: 'dumping_site:create', description: 'Create dumping site' },
      { name: 'dumping_site:read', description: 'Read dumping site data' },
      { name: 'dumping_site:update', description: 'Update dumping site' },
      { name: 'dumping_site:delete', description: 'Delete dumping site' },

      // Floodlight Permissions
      { name: 'floodlight:create', description: 'Create floodlight' },
      { name: 'floodlight:read', description: 'Read floodlight data' },
      { name: 'floodlight:update', description: 'Update floodlight' },
      { name: 'floodlight:delete', description: 'Delete floodlight' },

      // Hazard Zone Permissions
      { name: 'hazard_zone:create', description: 'Create hazard zone' },
      { name: 'hazard_zone:read', description: 'Read hazard zone data' },
      { name: 'hazard_zone:update', description: 'Update hazard zone' },
      { name: 'hazard_zone:delete', description: 'Delete hazard zone' },

      // Mast Permissions
      { name: 'mast:create', description: 'Create mast' },
      { name: 'mast:read', description: 'Read mast data' },
      { name: 'mast:update', description: 'Update mast' },
      { name: 'mast:delete', description: 'Delete mast' },

      // Railway Permissions
      { name: 'railway:create', description: 'Create railway' },
      { name: 'railway:read', description: 'Read railway data' },
      { name: 'railway:update', description: 'Update railway' },
      { name: 'railway:delete', description: 'Delete railway' },

      // Piped Water Permissions
      { name: 'piped_water:create', description: 'Create piped water' },
      { name: 'piped_water:read', description: 'Read piped water data' },
      { name: 'piped_water:update', description: 'Update piped water' },
      { name: 'piped_water:delete', description: 'Delete piped water' },

      // Police Station Permissions
      { name: 'police:create', description: 'Create police station' },
      { name: 'police:read', description: 'Read police station data' },
      { name: 'police:update', description: 'Update police station' },
      { name: 'police:delete', description: 'Delete police station' },

      // Powerline Permissions
      { name: 'powerline:create', description: 'Create powerline' },
      { name: 'powerline:read', description: 'Read powerline data' },
      { name: 'powerline:update', description: 'Update powerline' },
      { name: 'powerline:delete', description: 'Delete powerline' },

      // Sewer Permissions
      { name: 'sewer:create', description: 'Create sewer' },
      { name: 'sewer:read', description: 'Read sewer data' },
      { name: 'sewer:update', description: 'Update sewer' },
      { name: 'sewer:delete', description: 'Delete sewer' },

      // Path Permissions
      { name: 'path:create', description: 'Create path' },
      { name: 'path:read', description: 'Read path data' },
      { name: 'path:update', description: 'Update path' },
      { name: 'path:delete', description: 'Delete path' },

      // Stream Permissions
      { name: 'stream:create', description: 'Create stream' },
      { name: 'stream:read', description: 'Read stream data' },
      { name: 'stream:update', description: 'Update stream' },
      { name: 'stream:delete', description: 'Delete stream' },

      // Other Facility Permissions
      { name: 'other_facility:create', description: 'Create other facility' },
      { name: 'other_facility:read', description: 'Read other facility data' },
      { name: 'other_facility:update', description: 'Update other facility' },
      { name: 'other_facility:delete', description: 'Delete other facility' },

      // Road Asset Permissions
      { name: 'road_asset:create', description: 'Create road asset' },
      { name: 'road_asset:read', description: 'Read road asset data' },
      { name: 'road_asset:update', description: 'Update road asset' },
      { name: 'road_asset:delete', description: 'Delete road asset' },

      // Public Facility Permissions
      { name: 'public_facility:create', description: 'Create public facility' },
      { name: 'public_facility:read', description: 'Read public facility data' },
      { name: 'public_facility:update', description: 'Update public facility' },
      { name: 'public_facility:delete', description: 'Delete public facility' },

      // Post Evaluation Permissions
      { name: 'post_evaluation:create', description: 'Create post evaluation' },
      { name: 'post_evaluation:read', description: 'Read post evaluation data' },
      { name: 'post_evaluation:update', description: 'Update post evaluation' },
      { name: 'post_evaluation:delete', description: 'Delete post evaluation' },

      // Intervention Permissions
      { name: 'intervention:create', description: 'Create intervention' },
      { name: 'intervention:read', description: 'Read intervention data' },
      { name: 'intervention:update', description: 'Update intervention' },
      { name: 'intervention:delete', description: 'Delete intervention' },

      // Chart Indicator Permissions
      { name: 'chart_indicator:create', description: 'Create chart indicator' },
      { name: 'chart_indicator:read', description: 'Read chart indicator data' },
      { name: 'chart_indicator:update', description: 'Update chart indicator' },
      { name: 'chart_indicator:delete', description: 'Delete chart indicator' },

      // Status Permissions
      { name: 'status:create', description: 'Create status' },
      { name: 'status:read', description: 'Read status data' },
      { name: 'status:update', description: 'Update status' },
      { name: 'status:delete', description: 'Delete status' },

      // Activity Permissions
      { name: 'activity:create', description: 'Create activity' },
      { name: 'activity:read', description: 'Read activity data' },
      { name: 'activity:update', description: 'Update activity' },
      { name: 'activity:delete', description: 'Delete activity' },

      // Category Permissions
      { name: 'category:create', description: 'Create category' },
      { name: 'category:read', description: 'Read category data' },
      { name: 'category:update', description: 'Update category' },
      { name: 'category:delete', description: 'Delete category' },

      // Component Permissions
      { name: 'component:create', description: 'Create component' },
      { name: 'component:read', description: 'Read component data' },
      { name: 'component:update', description: 'Update component' },
      { name: 'component:delete', description: 'Delete component' },

      // Domain Permissions
      { name: 'domain:create', description: 'Create domain' },
      { name: 'domain:read', description: 'Read domain data' },
      { name: 'domain:update', description: 'Update domain' },
      { name: 'domain:delete', description: 'Delete domain' },

      // Intervention Type Permissions
      { name: 'intervention_type:create', description: 'Create intervention type' },
      { name: 'intervention_type:read', description: 'Read intervention type data' },
      { name: 'intervention_type:update', description: 'Update intervention type' },
      { name: 'intervention_type:delete', description: 'Delete intervention type' },

      // Lot Permissions
      { name: 'lot:create', description: 'Create lot' },
      { name: 'lot:read', description: 'Read lot data' },
      { name: 'lot:update', description: 'Update lot' },
      { name: 'lot:delete', description: 'Delete lot' },
    ];

    console.log('Creating permissions...');
    // Insert permissions if they don't exist
    for (const perm of permissions) {
      const [permission, created] = await db.permission.findOrCreate({ 
        where: { name: perm.name }, 
        defaults: perm 
      });
      if (created) {
        console.log(`Created permission: ${perm.name}`);
      } else {
        console.log(`Permission already exists: ${perm.name}`);
      }
    }
    console.log('All permissions created/verified');

    // Define role-permission mappings based on new requirements
    const allPermissionNames = permissions.map(p => p.name);
    const logsPermissions = allPermissionNames.filter(p => p.startsWith('logs:'));
    const rolesPermissions = allPermissionNames.filter(p => p.startsWith('roles:') || p.startsWith('permission:'));
    const userPermissions = allPermissionNames.filter(p => p.startsWith('user:'));
    const grievancePermissions = allPermissionNames.filter(p => p.startsWith('grievance:'));
    const gbvPermissions = allPermissionNames.filter(p => p.startsWith('gbv:'));

    const adminExcludes = [...rolesPermissions, ...allPermissionNames.filter(p => p.startsWith('permission:'))];
    const staffExcludes = [...adminExcludes, ...userPermissions];
    const consultantExcludes = userPermissions;
    const grmExcludes = [...userPermissions, ...rolesPermissions, ...allPermissionNames.filter(p => p.startsWith('permission:'))];

    const rolePermissions = {
      'root_admin': allPermissionNames, // Everything
      'super_admin': allPermissionNames, // Everything (including logs)
      'admin': allPermissionNames.filter(p => !adminExcludes.includes(p)), // Everything except roles/permissions management
      'staff': allPermissionNames.filter(p => !staffExcludes.includes(p)), // Everything except roles/permissions and user management
      'consultant': allPermissionNames.filter(p => !consultantExcludes.includes(p)), // Everything except user management
      'gbv': [...gbvPermissions, ...grievancePermissions], // Only GBV and grievance management
      'grm': grievancePermissions, // Only grievance management
      'support': allPermissionNames.filter(p => !adminExcludes.includes(p)), // Like admin
      'public': [], // Minimal or view-only, can be expanded as needed
      'monitoring': [], // Minimal or view-only, can be expanded as needed
    };

    console.log('Assigning permissions to roles...');
    // Assign permissions to roles
    for (const [roleName, permissions] of Object.entries(rolePermissions)) {
      console.log(`Processing role: ${roleName}`);
      const role = await db.role.findOne({ where: { name: roleName } });
      if (role) {
        let permsToAssign = await db.permission.findAll({ where: { name: permissions } });
        await role.setPermissions(permsToAssign);
        console.log(`Assigned ${permsToAssign.length} permissions to ${roleName}`);
      } else {
        console.log(`Warning: Role ${roleName} not found in database`);
      }
    }

    console.log('Permissions and role-permissions seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seedPermissions().catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
}); 