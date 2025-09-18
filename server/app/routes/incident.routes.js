const controller = require('../controllers/incident.controller')
const { authJwt } = require('../middleware')
const { hasPermission } = require('../middleware/permission')

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept')
    next()
  })

  app.post('/api/v1/inc/code', controller.generateINCCode)
  app.post('/api/v1/inc/create', [], controller.createIncident)
  app.post('/api/v1/inc/list', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidents)
  app.post('/api/v1/inc/one', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidentById)
  app.post('/api/v1/inc/update', [authJwt.verifyToken, hasPermission('incident:update')], controller.updateIncident)
  app.post('/api/v1/inc/delete', [authJwt.verifyToken, hasPermission('incident:delete')], controller.deleteIncident)
  app.post('/api/v1/inc/status', [authJwt.verifyToken, hasPermission('incident:update')], controller.updateIncidentStatus)

  // email
  app.post('/api/v1/inc/email/send', [authJwt.verifyToken, hasPermission('incident:update')], controller.sendIncidentEmail)

  // documents
  app.post('/api/v1/inc/upload', controller.uploadIncidentDocument)
  app.post('/api/v1/inc/documents', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidentDocuments)
  app.post('/api/v1/inc/documents/one', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidentDocumentById)
  app.post('/api/v1/inc/documents/delete', [authJwt.verifyToken, hasPermission('incident:delete')], controller.deleteIncidentDocument)
  app.post('/api/v1/inc/download', controller.downloadIncidentFile)

  // history tracking
  app.post('/api/v1/inc/history', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidentHistory)
  app.post('/api/v1/inc/history/action', [authJwt.verifyToken, hasPermission('incident:read')], controller.getIncidentHistoryByAction)

  // TEST: Serve route-specific HTML for /incidents with OG/Twitter tags injected
  const fs = require('fs')
  const path = require('path')
  app.get('/incidents', (req, res) => {
    try {
      console.log('Serving route-specific HTML for /incidents with OG/Twitter tags injected')
      const indexPath = path.join(__dirname, '../../public/index.html')
      let html = fs.readFileSync(indexPath, 'utf8')
      const tags = `\n      <meta property="og:title" content="Report an xIncident" />\n     
       <meta property="og:description" content="Report site incidents and accidents through KeSMIS." />\n     
        <meta property="og:type" content="website" />\n      
        <meta property="og:url" content="https://kesmis.go.ke/incidents" />\n      
        <meta property="og:image" content="https://kesmis.go.ke/assets/warning.png" />\n    
          <meta property="og:image:width" content="1200" />\n     
           <meta property="og:image:height" content="630" />\n      
           <meta name="twitter:card" content="summary_large_image" />\n     
            <meta name="twitter:title" content="Report an Incident - KeSMIS" />\n     
             <meta name="twitter:description" content="Report site incidents and accidents through KeSMIS." />\n     
              <meta name="twitter:image" content="https://kesmis.go.ke/assets/warning.png" />\n    
                <link rel="canonical" href="https://kesmis.go.ke/incidents" />\n    `
      html = html.replace('</head>', `${tags}\n</head>`)
      res.set('Content-Type', 'text/html').send(html)
    } catch (e) {
      res.status(500).send('Failed to render route shell')
    }
  })
}


