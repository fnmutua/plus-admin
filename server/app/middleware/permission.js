const db = require('../models');
const User = db.user;
const { getActiveRolesGetOptions } = require('../utils/userRoleExpiry');

// Sequelize model names that map to a different permission resource (e.g. users -> user:read).
const MODEL_PERMISSION_ALIASES = {
  users: 'user',
};

// Lookup/reference tables shared across modules (county filters, joins, labels, etc.).
const REFERENCE_DATA_MODELS = new Set([
  'county',
  'subcounty',
  'ward',
  'settlement',
  'document',
  'document_category',
  'document_type',
  'category',
  'domain',
  'component',
  'grievance_document',
  'incident_document',
  'ipc_document',
  'users',
  'user',
]);

// Any of these grants read access to reference lookup models above.
const CONTEXT_READ_PERMISSIONS = new Set([
  'grievance:read',
  'grievance:export',
  'grievance:viewLog',
  'grievance_history:read',
  'incident:read',
  'incident:export',
  'incident:viewLog',
  'settlement:read',
  'dashboard:read',
  'facility:read',
  'project:read',
  'disbursement:read',
  'households:read',
  'beneficiary:read',
  'user:read',
]);

function resolvePermissionName(model, action) {
  const normalized = String(model).toLowerCase();
  const resource = MODEL_PERMISSION_ALIASES[normalized] || normalized;
  return `${resource}:${action}`;
}

async function loadUserWithPermissions(userid) {
  const user = await User.findByPk(userid, {
    include: [{
      model: db.role,
      include: [db.permission],
    }],
  });

  if (!user) {
    return null;
  }

  const roleNames = user.roles ? user.roles.map((role) => role.name) : [];
  const permissions = user.roles
    ? user.roles.flatMap((role) => (role.permissions ? role.permissions.map((p) => p.name) : []))
    : [];

  return { user, roleNames, permissions };
}

async function loadUserWithPermissionsAndRoles(userid) {
  const user = await User.findByPk(userid, {
    include: [{
      model: db.role,
      ...getActiveRolesGetOptions(),
      include: [db.permission],
    }],
  });

  if (!user) {
    return null;
  }

  const roles = user.roles || [];
  const roleNames = roles.map((role) => role.name);
  const permissions = roles.flatMap((role) =>
    (role.permissions ? role.permissions.map((p) => p.name) : []),
  );

  return { user, roles, roleNames, permissions };
}

function isNationalRegionalReportReviewer(roleNames, roles) {
  if (roleNames.includes('root_admin') || roleNames.includes('super_admin')) {
    return true;
  }

  return (roles || []).some(
    (role) =>
      (role.name === 'admin' || role.name === 'slum_upgrading') &&
      role.user_roles?.location_level === 'national',
  );
}

async function evaluateRegionalReportSubmissionAccess(req, permissionName) {
  if (!req.userid) {
    return { allowed: false, status: 401, message: 'User not authenticated' };
  }

  const loaded = await loadUserWithPermissionsAndRoles(req.userid);
  if (!loaded) {
    return { allowed: false, status: 401, message: 'User not found' };
  }

  const { roleNames, roles, permissions } = loaded;

  if (!permissions.includes(permissionName)) {
    return { allowed: false, status: 403, message: 'Forbidden: insufficient permissions' };
  }

  if (!isNationalRegionalReportReviewer(roleNames, roles)) {
    return {
      allowed: false,
      status: 403,
      message: 'Forbidden: national administrator access required',
    };
  }

  return { allowed: true };
}

const requireRegionalReportSubmissionRead = () => async (req, res, next) => {
  try {
    const result = await evaluateRegionalReportSubmissionAccess(
      req,
      'regional_report_submission:read',
    );
    if (result.allowed) {
      return next();
    }
    return res.status(result.status).json({ message: result.message });
  } catch (error) {
    console.error('Error in requireRegionalReportSubmissionRead middleware:', error);
    return res.status(500).json({ message: 'Error checking permissions', error: error.message });
  }
};

const requireRegionalReportSubmissionReview = () => async (req, res, next) => {
  try {
    const result = await evaluateRegionalReportSubmissionAccess(
      req,
      'regional_report_submission:review',
    );
    if (result.allowed) {
      return next();
    }
    return res.status(result.status).json({ message: result.message });
  } catch (error) {
    console.error('Error in requireRegionalReportSubmissionReview middleware:', error);
    return res.status(500).json({ message: 'Error checking permissions', error: error.message });
  }
};

async function evaluatePermission(req, permissionName, options = {}) {
  const { allowReferenceRead = false, model = null } = options;

  if (!req.userid) {
    return { allowed: false, status: 401, message: 'User not authenticated' };
  }

  const loaded = await loadUserWithPermissions(req.userid);
  if (!loaded) {
    return { allowed: false, status: 401, message: 'User not found' };
  }

  const { roleNames, permissions } = loaded;

  if (roleNames.includes('super_admin') || roleNames.includes('root_admin')) {
    return { allowed: true };
  }

  if (permissions.includes(permissionName)) {
    return { allowed: true };
  }

  if (
    allowReferenceRead &&
    model &&
    REFERENCE_DATA_MODELS.has(String(model).toLowerCase()) &&
    permissions.some((permission) => CONTEXT_READ_PERMISSIONS.has(permission))
  ) {
    return { allowed: true };
  }

  return { allowed: false, status: 403, message: 'Forbidden: insufficient permissions' };
}

const hasPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const result = await evaluatePermission(req, permissionName);
      if (result.allowed) {
        return next();
      }

      if (result.status === 401) {
        console.error('hasPermission: auth failure for userid:', req.userid, result.message);
      } else {
        console.log('hasPermission: Access denied - user does not have permission:', permissionName);
      }

      return res.status(result.status).json({ message: result.message });
    } catch (error) {
      console.error('Error in hasPermission middleware:', error);
      return res.status(500).json({ message: 'Error checking permissions', error: error.message });
    }
  };
};

/** Allow if the user has any one of the listed permissions (or is root/super admin). */
const hasAnyPermission = (permissionNames) => {
  const names = Array.isArray(permissionNames) ? permissionNames : [permissionNames];
  return async (req, res, next) => {
    try {
      for (const permissionName of names) {
        const result = await evaluatePermission(req, permissionName);
        if (result.allowed) {
          return next();
        }
      }

      console.log(
        'hasAnyPermission: Access denied — user lacks all of:',
        names.join(', ')
      );
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    } catch (error) {
      console.error('Error in hasAnyPermission middleware:', error);
      return res.status(500).json({ message: 'Error checking permissions', error: error.message });
    }
  };
};

const hasDynamicPermission = (action) => {
  return async (req, res, next) => {
    try {
      const model = req.body.model || req.body.table || req.query.model || req.query.table;
      if (!model) {
        return res.status(400).json({ message: 'Model not specified' });
      }

      const permissionName = resolvePermissionName(model, action);
      const result = await evaluatePermission(req, permissionName, {
        allowReferenceRead: action === 'read',
        model,
      });

      if (result.allowed) {
        return next();
      }

      console.log(
        'hasDynamicPermission: Access denied for model',
        model,
        'action',
        action,
        'required permission:',
        permissionName
      );
      return res.status(result.status).json({ message: result.message });
    } catch (error) {
      console.error('Error in hasDynamicPermission middleware:', error);
      return res.status(500).json({ message: 'Error checking permissions', error: error.message });
    }
  };
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasDynamicPermission,
  requireRegionalReportSubmissionRead,
  requireRegionalReportSubmissionReview,
  loadUserWithPermissions,
  loadUserWithPermissionsAndRoles,
  isNationalRegionalReportReviewer,
  REFERENCE_DATA_MODELS,
  CONTEXT_READ_PERMISSIONS,
  resolvePermissionName,
};
