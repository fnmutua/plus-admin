const db = require('../models');
const User = db.user;

const hasPermission = (permissionName) => {
  return async (req, res, next) => {
    const user = await User.findByPk(req.userid, {
      include: [{
        model: db.role,
        include: [db.permission]
      }]
    });
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Flatten all permissions from all roles
    const userPermissions = user.roles.flatMap(role => role.permissions.map(p => p.name));
    if (userPermissions.includes(permissionName)) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
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