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

 
 
exports.createRole = async (req, res) => {
  try {
    let { name, description, subordinates, isactive } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    // Ensure subordinates is an array of integers if provided, or empty array
    if (subordinates === undefined || subordinates === null || subordinates === '') {
      subordinates = [];
    } else if (!Array.isArray(subordinates)) {
      try {
        subordinates = JSON.parse(subordinates);
      } catch (e) {
        subordinates = [];
      }
    }
    if (Array.isArray(subordinates)) {
      subordinates = subordinates.map(Number);
    }

    // Create the new role first
    const newRole = await db.models.roles.create({
      name,
      description,
      subordinates: subordinates,
      isactive
    });

    // Now add this new role as a subordinate to root_admin and super_admin
    const rootAdminRole = await db.role.findOne({ where: { name: 'root_admin' } });
    const superAdminRole = await db.role.findOne({ where: { name: 'super_admin' } });

    // Update root_admin to include this new role as a subordinate
    if (rootAdminRole) {
      const currentSubordinates = rootAdminRole.subordinates || [];
      if (!currentSubordinates.includes(newRole.id)) {
        const updatedSubordinates = [...currentSubordinates, newRole.id];
        await rootAdminRole.update({ subordinates: updatedSubordinates });
      }
    }

    // Update super_admin to include this new role as a subordinate
    if (superAdminRole) {
      const currentSubordinates = superAdminRole.subordinates || [];
      if (!currentSubordinates.includes(newRole.id)) {
        const updatedSubordinates = [...currentSubordinates, newRole.id];
        await superAdminRole.update({ subordinates: updatedSubordinates });
      }
    }

    res.status(200).send({
      message: 'Role created successfully',
      data: newRole,
      code: '0000'
    });
  } catch (err) {
    console.log('error0---------->', err);
    let message = 'The uploaded data does not match the required fields';
    if (err.name === 'SequelizeUniqueConstraintError') {
      message = 'One or more table constraints are violated. Check your id columns';
    }
    return res.status(500).send({ message });
  }
};

exports.editRole = async (req, res) => {
  // Prevent editing root_admin
  if (req.body.name === 'root_admin' || req.body.id === 1) {
    return res.status(403).send({ message: 'Editing root_admin is not allowed', code: '9999' });
  }
  console.log('editing......',req.body);
  
  try {
    var roleId = req.body.id; // Assuming the role ID is passed as a URL parameter
    var updatedData = { ...req.body }; // Assuming the updated data is present in the request body

    // Ensure subordinates is an array
    if (updatedData.subordinates !== undefined) {
      let subordinates = updatedData.subordinates;
      if (!Array.isArray(subordinates)) {
        try {
          subordinates = JSON.parse(subordinates);
        } catch (e) {
          subordinates = [];
        }
      }
      subordinates = subordinates.map(Number);
      updatedData.subordinates = subordinates;
    }

    // Update the role record with the new data
    const result = await db.models.roles.update(updatedData, {
      where: {
        id: roleId,
      },
    });

    if (result[0] === 1) {
      // Ensure this role remains a subordinate of root_admin and super_admin
      const rootAdminRole = await db.role.findOne({ where: { name: 'root_admin' } });
      const superAdminRole = await db.role.findOne({ where: { name: 'super_admin' } });

      // Update root_admin to include this role as a subordinate
      if (rootAdminRole) {
        const currentSubordinates = rootAdminRole.subordinates || [];
        if (!currentSubordinates.includes(Number(roleId))) {
          const updatedSubordinates = [...currentSubordinates, Number(roleId)];
          await rootAdminRole.update({ subordinates: updatedSubordinates });
        }
      }

      // Update super_admin to include this role as a subordinate
      if (superAdminRole) {
        const currentSubordinates = superAdminRole.subordinates || [];
        if (!currentSubordinates.includes(Number(roleId))) {
          const updatedSubordinates = [...currentSubordinates, Number(roleId)];
          await superAdminRole.update({ subordinates: updatedSubordinates });
        }
      }

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
  } catch (err) {
    // handle error;
    console.log('error---------->', err);
    return res.status(500).send({
      message: 'An error occurred while updating the role',
      code: '0002',
    });
  }
};

exports.deleteRole = (req, res) => {
  // Prevent deleting root_admin
  if (req.body.name === 'root_admin' || req.body.roleId === 1) {
    return res.status(403).send({ message: 'Deleting root_admin is not allowed', code: '9999' });
  }
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
  // Prevent returning root_admin
  if (req.params.roleId == 1 || req.body.name === 'root_admin') {
    return res.status(403).send({ message: 'Access to root_admin is not allowed', code: '9999' });
  }
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
      // Filter out root_admin
      const filteredRoles = roles.filter(role => role.name !== 'root_admin');

      console.log('filteredRoles ------------->',filteredRoles)
      res.status(200).send({
        message: 'Roles retrieved successfully',
        data: filteredRoles,
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
 
exports.getSubordinateRoles = async (req, res) => {
  try {
    console.log('Getting getSubordinateRoles roles.2.....');

    // Support both req.body.currentUser.roles and req.body.roles
    const currentUserRoles = req.body.currentUser && req.body.currentUser.roles
      ? req.body.currentUser.roles
      : req.body.roles;

    console.log('Current User Roles:', currentUserRoles);

    // Step 1: Get the current user's role IDs
    const userRoleIds = currentUserRoles.map(role => role.id);

    // Step 2: Retrieve all role records
    const roles = await db.role.findAll();

    // Step 3: For each user role ID, collect all subordinate IDs from the corresponding role
    let allSubordinateIds = [];
    for (const roleId of userRoleIds) {
      const roleObj = roles.find(r => r.id === roleId);
      if (roleObj && Array.isArray(roleObj.subordinates)) {
        allSubordinateIds.push(...roleObj.subordinates);
      }
    }
    // Step 4: Collect all unique subordinate IDs
    const uniqueSubordinates = [...new Set(allSubordinateIds)];

    // Step 5: Find roles corresponding to these subordinate IDs
    const subordinateRoles = roles.filter(role =>
      uniqueSubordinates.includes(role.id) && role.name !== 'root_admin'
    );

    // Send the subordinate roles array in the response
    res.status(200).send({
      message: 'Subordinate roles retrieved successfully',
      data: subordinateRoles,
      code: '0000',
    });
  } catch (err) {
    // Handle errors, e.g., database errors
    console.error('Error:', err);
    res.status(500).send({
      message: 'An error occurred while retrieving roles',
      code: '0001',
    });
  }
};

// Add RESTful role-permission management methods
exports.getRolePermissions = async (req, res) => {
  console.log('----------------------------------------------------,',req.body.roleId  )
  try {
    let roleId = req.body.roleId  

    if (!roleId) return res.status(400).json({ message: 'No roleId(s) provided' });

    // Single role
    // Find all role_permissions for this roleId
    const rolePerms = await db.models.role_permissions.findAll({ where: { roleid: roleId } });
    if (!rolePerms || rolePerms.length === 0) return res.status(404).json({ message: 'Role not found or no permissions' });
    // Get permission ids
    const permIds = rolePerms.map(rp => rp.permissionid);
    // Fetch permission details
    const permissions = await db.models.permissions.findAll({ where: { id: permIds } });
    return res.json({ data: permissions });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching role permissions', error: err });
  }
};

exports.setRolePermissions = async (req, res) => {
  console.log('settign roles ------------------>')
 
    const roleId = req.body.roleId;
    const permissions = req.body.permissions; // array of permission ids or names
    // const role = await db.models.role.findByPk(roleId);
   // const role = await db.role.findOne({ where: { id: roleId } });
   const role = await db.role.findOne({ where: { id: roleId } });

    console.log(role)
    if (!role) return res.status(404).json({ message: 'Role not found' });
    // Find permission records
    const perms = await db.permission.findAll({
      where: { id: permissions }
    });
   // console.log(perms)
    await role.setPermissions(perms);
    res.json({ message: 'Permissions updated' });
  
};

exports.addRolePermission = async (req, res) => {
  console.log('add role')
  try {
    const roleId = req.params.roleId;
    const { permission } = req.body; // permission id or name
    const role = await db.models.roles.findByPk(roleId);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    const perm = await db.models.permissions.findOne({ where: { name: permission } });
    if (!perm) return res.status(404).json({ message: 'Permission not found' });
    await role.addPermission(perm);
    res.json({ message: 'Permission added' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding permission', error: err });
  }
};

exports.removeRolePermission = async (req, res) => {
  console.log('add role')

  try {
    const roleId = req.params.roleId;
    const permissionId = req.params.permissionId;
    const role = await db.models.roles.findByPk(roleId);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    const perm = await db.models.permissions.findByPk(permissionId);
    if (!perm) return res.status(404).json({ message: 'Permission not found' });
    await role.removePermission(perm);
    res.json({ message: 'Permission removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing permission', error: err });
  }
};
