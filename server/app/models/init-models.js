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
var _structures = require('./structures')
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
var _component= require('./component')
var _domain= require('./domain')
var _project_category= require('./project_category')
var _project_menu= require('./project_menu')
var _subcounty= require('./subcounty')
var _document_type= require('./document_type')
var _logs= require('./logs')
var _piped_water= require('./piped_water')



var _settlement_uploads = require('./settlement_uploads')

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
  var structures = _structures(sequelize, DataTypes)
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
  var component = _component(sequelize, DataTypes)
  var domain = _domain(sequelize, DataTypes)
   
  var project_category = _project_category(sequelize, DataTypes)
  var project_menu = _project_menu(sequelize, DataTypes)
  var subcounty = _subcounty(sequelize, DataTypes)
  var document_type = _document_type(sequelize, DataTypes)
  var logs = _logs(sequelize, DataTypes)
  var piped_water = _piped_water(sequelize, DataTypes)

  
  
  
  return {
    beneficiary,
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
    structures,
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
     programme,
     document,
    component,
    domain,
    project_category,
    project_menu,
    subcounty,
    document_type,
    logs,
    piped_water,
    settlement_uploads
  }
}
module.exports = initModels
module.exports.initModels = initModels
module.exports.default = initModels
