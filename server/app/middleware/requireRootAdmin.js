const db = require('../models')

const requireRootAdmin = async (req, res, next) => {
  try {
    if (!req.userid) {
      return res.status(401).json({ message: 'User not authenticated', code: '1001' })
    }

    const user = await db.user.findByPk(req.userid, {
      include: [{ model: db.role }],
    })

    const isRootAdmin = user?.roles?.some((role) => role.name === 'root_admin')
    if (!isRootAdmin) {
      return res.status(403).json({
        message: 'Forbidden: root administrator access required',
        code: '9999',
      })
    }

    return next()
  } catch (error) {
    console.error('Error in requireRootAdmin middleware:', error)
    return res.status(500).json({
      message: 'Error checking access',
      code: '9999',
      error: error.message,
    })
  }
}

module.exports = { requireRootAdmin }
