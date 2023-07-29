const db = require('../models')
//const db = require('../models').default;

const config = require('../config/auth.config')
//const User = db.user;
const Role = db.role
const User = db.user
 //db.models[reg_model]
const Op = db.Sequelize.Op
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const turf = require('@turf/turf');

 
 
exports.createRole = (req, res) => {
  console.log('creating......')
  var obj = req.body
 
  console.log('One record... ----', obj)

  // insert
  db.models.roles
    .create(obj)
    .then(function (item) {
      res.status(200).send({
        message: 'Role created successfully',
        data: item,
        code: '0000'
      })
    })
    .catch(function (err) {
      // handle error;
      console.log('error0---------->', err)

      if (err.name == 'SequelizeUniqueConstraintError') {
        var message = 'xOne or more table constraints are violated. Check your id columns'
      } else {
        var message = 'The uploaded file does not match the required fields'
      }
      return res.status(500).send({ message: message })
    })
}

exports.editRole = (req, res) => {
  console.log('editing......');
  var roleId = req.body.roleId; // Assuming the role ID is passed as a URL parameter
  var updatedData = req.body; // Assuming the updated data is present in the request body

  // Update the role record with the new data
  db.models.roles
    .update(updatedData, {
      where: {
        id: roleId,
      },
    })
    .then(function (result) {
      if (result[0] === 1) {
        // 'result[0] === 1' means one row was affected, indicating the role was updated successfully
        res.status(200).send({
          message: 'Role updated successfully',
          code: '0000',
        });
      } else {
        // 'result[0] !== 1' means zero rows were affected, indicating the role with the given ID was not found
        res.status(404).send({
          message: 'Role not found',
          code: '0001',
        });
      }
    })
    .catch(function (err) {
      // handle error;
      console.log('error---------->', err);
      return res.status(500).send({
        message: 'An error occurred while updating the role',
        code: '0002',
      });
    });
};

exports.deleteRole = (req, res) => {
  console.log('deleting......');
  var roleId = req.body.roleId; // Assuming the role ID is passed as a URL parameter

  // Delete the role record with the given ID
  db.models.roles
    .destroy({
      where: {
        id: roleId,
      },
    })
    .then(function (result) {
      if (result === 1) {
        // 'result === 1' means one row was affected, indicating the role was deleted successfully
        res.status(200).send({
          message: 'Role deleted successfully',
          code: '0000',
        });
      } else {
        // 'result !== 1' means zero rows were affected, indicating the role with the given ID was not found
        res.status(404).send({
          message: 'Role not found',
          code: '0001',
        });
      }
    })
    .catch(function (err) {
      // handle error;
      console.log('error---------->', err);
      return res.status(500).send({
        message: 'An error occurred while deleting the role',
        code: '0002',
      });
    });
};


exports.getRoleById = (req, res) => {
  console.log('getting one role......');
  var roleId = req.params.roleId; // Assuming the role ID is passed as a URL parameter

  // Find the role record with the given ID
  db.models.roles
    .findByPk(roleId)
    .then(function (role) {
      if (role) {
        // If the role is found, send it in the response
        res.status(200).send({
          message: 'Role retrieved successfully',
          data: role,
          code: '0000',
        });
      } else {
        // If the role with the given ID is not found, return a 404 Not Found response
        res.status(404).send({
          message: 'Role not found',
          code: '0001',
        });
      }
    })
    .catch(function (err) {
      // Handle errors, e.g., database errors
      console.log('error---------->', err);
      return res.status(500).send({
        message: 'An error occurred while retrieving the role',
        code: '0002',
      });
    });
};

exports.getAllRoles = (req, res) => {
  console.log('getting all roles......');

  // Retrieve all role records
  db.models.roles
    .findAll()
    .then(function (roles) {
      // Send the roles array in the response
      res.status(200).send({
        message: 'Roles retrieved successfully',
        data: roles,
        code: '0000',
      });
    })
    .catch(function (err) {
      // Handle errors, e.g., database errors
      console.log('error---------->', err);
      return res.status(500).send({
        message: 'An error occurred while retrieving roles',
        code: '0001',
      });
    });
};
