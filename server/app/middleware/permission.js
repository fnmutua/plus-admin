const db = require('../models');
const User = db.user;

const hasPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.userid) {
        console.error('hasPermission: req.userid is missing');
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const user = await User.findByPk(req.userid, {
        include: [{
          model: db.role,
          include: [db.permission]
        }]
      });
      
      if (!user) {
        console.error('hasPermission: User not found for userid:', req.userid);
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user has super_admin or root_admin role - they have all permissions
      const userRoles = user.roles ? user.roles.map(role => role.name) : [];
      console.log('hasPermission: Checking permission', permissionName, 'for user roles:', userRoles);
      
      if (userRoles.includes('super_admin') || userRoles.includes('root_admin')) {
        console.log('hasPermission: User has super_admin or root_admin role, allowing access');
        return next();
      }

      // Flatten all permissions from all roles
      const userPermissions = user.roles ? user.roles.flatMap(role => role.permissions ? role.permissions.map(p => p.name) : []) : [];
      console.log('hasPermission: User permissions:', userPermissions);
      
      if (userPermissions.includes(permissionName)) {
        console.log('hasPermission: User has required permission, allowing access');
        return next();
      }
      
      console.log('hasPermission: Access denied - user does not have permission:', permissionName);
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    } catch (error) {
      console.error('Error in hasPermission middleware:', error);
      return res.status(500).json({ message: 'Error checking permissions', error: error.message });
    }
  };
};

const hasDynamicPermission = (action) => {
  return async (req, res, next) => {
    const model = req.body.model || req.body.table || req.query.model || req.query.table;
    if (!model) return res.status(400).json({ message: 'Model not specified' });
    const permissionName = `${model.toLowerCase()}:${action}`;
    return hasPermission(permissionName)(req, res, next);
  };
};

module.exports = { hasPermission, hasDynamicPermission }; 