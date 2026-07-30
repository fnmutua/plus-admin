var DataTypes = require('sequelize').DataTypes
var _beneficiary = require('./beneficiary')
var _beneficiary_parcel = require('./beneficiary_parcel')
var _county = require('./county')
var _facility_type = require('./facility_type')
var _landuse_type = require('./landuse_type')
var _ownership_type = require('./ownership_type')
var _parcel = require('./parcel')
var _path = require('./path')
var _public_facility = require('./public_facility')
var _road = require('./road')
var _settlement = require('./settlement')
var _settlement_type = require('./settlement_type')
var _sewer = require('./sewer')
var _status = require('./status')
var _stream = require('./stream')
var _structure_type = require('./structure_type')
var _user_roles = require('./user_roles')
var _users = require('./users')
var _households = require('./households')
var _roles = require('./role')
var _intervention_type = require('./intervention_type')
var _intervention = require('./intervention')
var _cluster = require('./cluster')
var _lot = require('./lot')
var _benefit_type = require('./benefit_type')
var _settlement_status = require('./settlement_status')
var _health_facility = require('./health_facility')
var _education_facility = require('./education_facility')
var _water_point = require('./water_point')
var _road_asset = require('./road_asset')
var _other_facility = require('./other_facility')

var _category = require('./category')
var _indicator = require('./indicator')
var _indicator_category = require('./indicator_category')
var _indicator_category_report = require('./indicator_category_report')
var _project= require('./project')
var _programme= require('./programme')
var _document= require('./document')
var _document_link = require('./document_link')
var _document_share = require('./document_share')
var _document_share_item = require('./document_share_item')
var _upload_share_link = require('./upload_share_link')
var _component= require('./component')
var _domain= require('./domain')
var _project_category= require('./project_category')
var _project_menu= require('./project_menu')
var _subcounty= require('./subcounty')
var _document_type= require('./document_type')
var _logs= require('./logs')
var _piped_water= require('./piped_water')
var _activity= require('./activity')
var _project_activity= require('./project_activity')
var _evaluation_type= require('./evaluation_type')
var _evaluation= require('./evaluation')
var _ward= require('./ward')
var _dashboard= require('./dashboard')
var _dashboard_card= require('./dashboard_card')
var _dashboard_section= require('./dashboard_section')
var _dashboard_section_chart= require('./dashboard_section_chart')

var _chart_indicator= require('./chart_indicator')
var _document_category= require('./document_category')
var _feedback= require('./feedback')
var _frequency= require('./frequency')
var _programme_implementation= require('./programme_implementation')
var _contractor= require('./contractor')
var _project_location = require('./project_location')
var _project_beneficiary = require('./project_beneficiary') 

var _settlement_uploads = require('./settlement_uploads')
var _imagery_layer = require('./imagery_layer')


// grievances 
var _grievance = require('./Grievance')
var _incident = require('./Incident')
var _incident_history = require('./incident_history')
var _grievance_log = require('./GrievanceAction')
var _grievance_document = require('./GrievanceDocument')
var _incident_document = require('./IncidentDocument')
var _grievance_escalation = require('./GrievanceEscalation')
var _grievance_resolution= require('./GrievanceResolution')
var _grievance_resolution_level= require('./GrievanceResolutionLevel')
var _OTP= require('./otp')
var _grievance_notification= require('./grievance_notification')
var _structure= require('./structure')
var _article= require('./article')
var _settlement_history= require('./settlement_history')
var _project_history= require('./project_history')
var _settlement_population = require('./settlement_population')
var _county_population_growth_rate = require('./county_population_growth_rate')
var _grievance_history= require('./grievance_history')
var _module_settings= require('./module_settings')
var _vulnerability_matrix= require('./vulnerability_matrix')
var _vulnerability_rating_threshold= require('./vulnerability_rating_threshold')
var _climate_assessment= require('./climate_assessment')
var _climate_assessment_version= require('./climate_assessment_version')
var _page_visit= require('./page_visit')

var _disbursement= require('./disbursements')
var _ipc_document = require('./IpcDocument')
var _project_contractor= require('./project_contractor')
var _project_team= require('./project_team')
var _project_clockin= require('./project_clockin')

 
var _powerline= require('./powerline')
var _railway= require('./railway')
var _police_station= require('./police')
var _crime_hotspot= require('./crime_hotspot')
var _floodlight= require('./floodlight')



var _hazard_zone= require('./hazard_zone')
var _community_hall= require('./community_hall')
var _community_project= require('./community_project')
var _mast= require('./mast')
var _street_light= require('./street_light')
var _dumping_site= require('./dumping_site')
var _powerline_asset= require('./powerline_asset')
var _railway_asset= require('./railway_asset')


var _permission= require('./permission')
var _role_permissions= require('./role_permissions')
var _role_programme_access= require('./role_programme_access')
var _role= require('./role')
var _data_request= require('./data_request')
var _data_request_document = require('./DataRequestDocument')
var _data_request_share = require('./DataRequestShare')
var _data_request_message = require('./DataRequestMessage')
var _communication = require('./communication')
var _communication_recipient = require('./communication_recipient')
var _user_notification = require('./user_notification')



function initModels(sequelize) {
  var beneficiary = _beneficiary(sequelize, DataTypes)
  var beneficiary_parcel = _beneficiary_parcel(sequelize, DataTypes)
  var county = _county(sequelize, DataTypes)
  var facility_type = _facility_type(sequelize, DataTypes)
  var landuse_type = _landuse_type(sequelize, DataTypes)
  var ownership_type = _ownership_type(sequelize, DataTypes)
  var parcel = _parcel(sequelize, DataTypes)
  var path = _path(sequelize, DataTypes)
  var public_facility = _public_facility(sequelize, DataTypes)
  var road = _road(sequelize, DataTypes)
  var settlement = _settlement(sequelize, DataTypes)
  var settlement_type = _settlement_type(sequelize, DataTypes)
  var sewer = _sewer(sequelize, DataTypes)
  var status = _status(sequelize, DataTypes)
  var stream = _stream(sequelize, DataTypes)
  var structure_type = _structure_type(sequelize, DataTypes)
  var user_roles = _user_roles(sequelize, DataTypes)
  var users = _users(sequelize, DataTypes)
  var households = _households(sequelize, DataTypes)
  var roles = _roles(sequelize, DataTypes)
  var intervention_type = _intervention_type(sequelize, DataTypes)
  var intervention = _intervention(sequelize, DataTypes)
  var cluster = _cluster(sequelize, DataTypes)
  var lots = _lot(sequelize, DataTypes)
  var benefit_type = _benefit_type(sequelize, DataTypes)
  var settlement_uploads = _settlement_uploads(sequelize, DataTypes)
  var imagery_layer = _imagery_layer(sequelize, DataTypes)
  var settlement_status = _settlement_status(sequelize, DataTypes)
  var health_facility = _health_facility(sequelize, DataTypes)
  var education_facility = _education_facility(sequelize, DataTypes)
  var water_point = _water_point(sequelize, DataTypes)
  var road_asset = _road_asset(sequelize, DataTypes)
  var other_facility = _other_facility(sequelize, DataTypes)

  var category = _category(sequelize, DataTypes)
  var indicator = _indicator(sequelize, DataTypes)
  var indicator_category = _indicator_category(sequelize, DataTypes)
  var indicator_category_report = _indicator_category_report(sequelize, DataTypes)
  var project = _project(sequelize, DataTypes)
  var programme = _programme(sequelize, DataTypes)
  var document = _document(sequelize, DataTypes)
  var document_link = _document_link(sequelize, DataTypes)
  var document_share = _document_share(sequelize, DataTypes)
  var document_share_item = _document_share_item(sequelize, DataTypes)
  var upload_share_link = _upload_share_link(sequelize, DataTypes)
  var component = _component(sequelize, DataTypes)
  var domain = _domain(sequelize, DataTypes)
   
  var project_category = _project_category(sequelize, DataTypes)
  var project_menu = _project_menu(sequelize, DataTypes)
  var subcounty = _subcounty(sequelize, DataTypes)
  var document_type = _document_type(sequelize, DataTypes)
  var logs = _logs(sequelize, DataTypes)
  var piped_water = _piped_water(sequelize, DataTypes)
  var activity = _activity(sequelize, DataTypes)
  var project_activity = _project_activity(sequelize, DataTypes)
  var evaluation_type = _evaluation_type(sequelize, DataTypes)
  var evaluation = _evaluation(sequelize, DataTypes)
  var ward = _ward(sequelize, DataTypes)
  var dashboard = _dashboard(sequelize, DataTypes)
  var dashboard_card = _dashboard_card(sequelize, DataTypes)
  var dashboard_section = _dashboard_section(sequelize, DataTypes)
  var dashboard_section_chart = _dashboard_section_chart(sequelize, DataTypes)
  var chart_indicator = _chart_indicator(sequelize, DataTypes)
  var document_category = _document_category(sequelize, DataTypes)
  var feedback = _feedback(sequelize, DataTypes)
  var frequency = _frequency(sequelize, DataTypes)
  var programme_implementation = _programme_implementation(sequelize, DataTypes)
  var contractor = _contractor(sequelize, DataTypes)
  var project_location = _project_location(sequelize, DataTypes)
  var project_beneficiary = _project_beneficiary(sequelize, DataTypes)
  

  // Greivances 
  var grievance = _grievance(sequelize, DataTypes)
  var incident = _incident(sequelize, DataTypes)
  var incident_history = _incident_history(sequelize, DataTypes)
  var grievance_log = _grievance_log(sequelize, DataTypes)
  var grievance_document = _grievance_document(sequelize, DataTypes)
  var incident_document = _incident_document(sequelize, DataTypes)
  var grievance_escalation = _grievance_escalation(sequelize, DataTypes)
  var grievance_resolution = _grievance_resolution(sequelize, DataTypes)
  var grievance_resolution_level = _grievance_resolution_level(sequelize, DataTypes)
  var otp = _OTP(sequelize, DataTypes)
  var grievance_notification = _grievance_notification(sequelize, DataTypes)
  var structure = _structure(sequelize, DataTypes)

  var article = _article(sequelize, DataTypes)
  var settlement_history = _settlement_history(sequelize, DataTypes)
  var project_history = _project_history(sequelize, DataTypes)
  var settlement_population = _settlement_population(sequelize, DataTypes)
  var county_population_growth_rate = _county_population_growth_rate(sequelize, DataTypes)
  var grievance_history = _grievance_history(sequelize, DataTypes)
  var module_settings = _module_settings(sequelize, DataTypes)
  var vulnerability_matrix = _vulnerability_matrix(sequelize, DataTypes)
  var vulnerability_rating_threshold = _vulnerability_rating_threshold(sequelize, DataTypes)
  var climate_assessment = _climate_assessment(sequelize, DataTypes)
  var climate_assessment_version = _climate_assessment_version(sequelize, DataTypes)
  var page_visit = _page_visit(sequelize, DataTypes)
  var disbursement = _disbursement(sequelize, DataTypes)
  var ipc_document = _ipc_document(sequelize, DataTypes)
  var project_contractor = _project_contractor(sequelize, DataTypes)
  var project_team = _project_team(sequelize, DataTypes)
  var project_clockin = _project_clockin(sequelize, DataTypes)


  // Round 1 
  var railway = _railway(sequelize, DataTypes)
  var powerline = _powerline(sequelize, DataTypes)
  var floodlight = _floodlight(sequelize, DataTypes)
  var crime_hotspot = _crime_hotspot(sequelize, DataTypes)
  var police_station = _police_station(sequelize, DataTypes)

  
 

  



var hazard_zone = _hazard_zone(sequelize, DataTypes)
var community_hall = _community_hall(sequelize, DataTypes)
var community_project = _community_project(sequelize, DataTypes)
var mast = _mast(sequelize, DataTypes)
var street_light = _street_light(sequelize, DataTypes)
var dumping_site = _dumping_site(sequelize, DataTypes)
var powerline_asset = _powerline_asset(sequelize, DataTypes)
var railway_asset = _railway_asset(sequelize, DataTypes)
var permissions = _permission(sequelize, DataTypes)
var role_permissions = _role_permissions(sequelize, DataTypes)
  var role_programme_access = _role_programme_access(sequelize, DataTypes)
  var role = _role(sequelize, DataTypes)
var data_request = _data_request(sequelize, DataTypes)
var data_request_document = _data_request_document(sequelize, DataTypes)
var data_request_share = _data_request_share(sequelize, DataTypes)
var data_request_message = _data_request_message(sequelize, DataTypes)
var communication = _communication(sequelize, DataTypes)
var communication_recipient = _communication_recipient(sequelize, DataTypes)
var user_notification = _user_notification(sequelize, DataTypes)

// Communications associations: a broadcast has many per-channel recipient rows.
communication.hasMany(communication_recipient, {
  foreignKey: 'communication_id',
  as: 'recipients',
  onDelete: 'CASCADE'
})
communication_recipient.belongsTo(communication, {
  foreignKey: 'communication_id',
  as: 'communication'
})




  return {
    data_request,
    data_request_document,
    data_request_share,
    data_request_message,
    communication,
    communication_recipient,
    user_notification,
    beneficiary,otp,hazard_zone,community_hall,community_project,mast,street_light,dumping_site,
    powerline,powerline_asset,railway,railway_asset,floodlight,crime_hotspot,floodlight,police_station,
    beneficiary_parcel,
    county,
    facility_type,
    landuse_type,
    ownership_type,
    parcel,
    path,
    public_facility,
    road,
    settlement,
    settlement_type,
    sewer,
    status,
    stream,
    structure_type,
    structure,
    user_roles,
    users,
    households,
    roles,
    intervention_type,
    intervention,
    cluster,
    lots,
    benefit_type,
    settlement_status,
    health_facility,
    education_facility,
    water_point,
    road_asset,
    other_facility,
    category,
     indicator ,
     indicator_category,
     indicator_category_report,
     project,
    
    document, document_link, document_share, document_share_item, upload_share_link,
    component,
    domain,
    project_category,
    project_menu,
    subcounty,
    document_type,
    logs,
    piped_water,
    activity,
    project_activity,
    evaluation_type,
    evaluation,
    ward,
    dashboard,
    dashboard_card,
    dashboard_section,
    dashboard_section_chart,
    chart_indicator,
    document_category,
    settlement_uploads,
    imagery_layer,
    feedback,
    frequency,
    programme_implementation,
    contractor,
    project_location,
    project_beneficiary,grievance_resolution_level,
    grievance, incident, incident_history,
    grievance_log,disbursement,ipc_document,project_contractor,project_team,project_clockin,
     grievance_resolution,grievance_escalation,grievance_document, incident_document, grievance_notification,article,
     settlement_history,project_history,settlement_population,county_population_growth_rate,grievance_history, programme,permissions,role_permissions,role_programme_access,role,module_settings,
     vulnerability_matrix,vulnerability_rating_threshold,climate_assessment,climate_assessment_version,page_visit

  }
}
module.exports = initModels
module.exports.initModels = initModels
module.exports.default = initModels
