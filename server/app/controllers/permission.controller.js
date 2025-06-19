const db = require('../models')

exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await db.models.permissions.findAll();
    res.json({ data: permissions });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching permissions', error: err });
  }
}; 