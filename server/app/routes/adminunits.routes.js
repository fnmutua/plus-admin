const controller = require('../controllers/adminunits.controller')
const { authJwt } = require('../middleware')
const db = require('../models')

// Middleware to check if user is superadmin or root_admin
const isAdminRole = async (req, res, next) => {
  try {
    const user = await db.user.findByPk(req.userid, {
      include: [{ model: db.role }]
    })
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }
    
    const userRoles = user.roles.map(role => role.name)
    const allowedRoles = ['root_admin', 'super_admin']
    
    if (userRoles.some(role => allowedRoles.includes(role))) {
      return next()
    }
    
    return res.status(403).json({ message: 'Forbidden: Admin access required' })
  } catch (error) {
    console.error('Error checking admin role:', error)
    return res.status(500).json({ message: 'Error checking permissions' })
  }
}

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  // County endpoints
  app.get('/api/v1/adminunits/counties', [authJwt.verifyToken,], controller.getCounties)
  app.get('/api/v1/adminunits/counties/:id', [authJwt.verifyToken], controller.getCountyById)
  app.post('/api/v1/adminunits/counties', [authJwt.verifyToken, isAdminRole], controller.createCounty)
  app.put('/api/v1/adminunits/counties/:id', [authJwt.verifyToken, isAdminRole], controller.updateCounty)

  // Subcounty endpoints
  app.get('/api/v1/adminunits/subcounties', [authJwt.verifyToken, isAdminRole], controller.getSubcounties)
  app.get('/api/v1/adminunits/subcounties/:id', [authJwt.verifyToken, isAdminRole], controller.getSubcountyById)
  app.post('/api/v1/adminunits/subcounties', [authJwt.verifyToken, isAdminRole], controller.createSubcounty)
  app.put('/api/v1/adminunits/subcounties/:id', [authJwt.verifyToken, isAdminRole], controller.updateSubcounty)

  // Ward endpoints
  app.get('/api/v1/adminunits/wards', [authJwt.verifyToken, isAdminRole], controller.getWards)
  app.get('/api/v1/adminunits/wards/:id', [authJwt.verifyToken, isAdminRole], controller.getWardById)
  app.post('/api/v1/adminunits/wards', [authJwt.verifyToken, isAdminRole], controller.createWard)
  app.put('/api/v1/adminunits/wards/:id', [authJwt.verifyToken, isAdminRole], controller.updateWard)

  // Point-based locator endpoint for admin units
  app.post('/api/v1/adminunits/locate', [authJwt.verifyToken, isAdminRole], controller.locateAdminUnitsByPoint)
}

