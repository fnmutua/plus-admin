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
  var clusters = _cluster(sequelize, DataTypes)
  var lots = _lot(sequelize, DataTypes)
  var benefit_type = _benefit_type(sequelize, DataTypes)
  var settlement_uploads = _settlement_uploads(sequelize, DataTypes)
  var settlement_status = _settlement_status(sequelize, DataTypes)

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
    clusters,
    lots,
    benefit_type,
    settlement_status,
    settlement_uploads
  }
}
module.exports = initModels
module.exports.initModels = initModels
module.exports.default = initModels
