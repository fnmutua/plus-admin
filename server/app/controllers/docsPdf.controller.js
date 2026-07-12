const { loadUserWithPermissions } = require('../middleware/permission');
const { generateDocsPdf } = require('../services/docsPdf.service');

exports.downloadDocsPdf = async (req, res) => {
  const scope = req.body.scope === 'current' ? 'current' : 'all';
  const sectionId = req.body.sectionId ? String(req.body.sectionId) : undefined;

  try {
    const loaded = await loadUserWithPermissions(req.userid);
    if (!loaded) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const requestedSections = Array.isArray(req.body.sections) ? req.body.sections : [];
    if (!requestedSections.length || requestedSections.length > 250) {
      return res.status(400).json({ message: 'No valid documentation sections supplied.' });
    }

    const roleNames = new Set(loaded.roleNames || []);
    const permissions = new Set(loaded.permissions || []);
    const wildcard = permissions.has('*.*.*');
    const sections = requestedSections.filter((section) => {
      if (!section || typeof section.label !== 'string' || typeof section.content !== 'string') {
        return false;
      }
      const gates = Array.isArray(section.accessGates) ? section.accessGates : [];
      return gates.every((gate) => {
        const roles = Array.isArray(gate.roles) ? gate.roles : [];
        const requiredPermissions = Array.isArray(gate.permissions) ? gate.permissions : [];
        const roleOk = !roles.length || roles.some((role) => roleNames.has(role));
        const permissionOk =
          !requiredPermissions.length ||
          wildcard ||
          requiredPermissions.some((permission) => permissions.has(permission));
        return roleOk && permissionOk;
      });
    });

    if (!sections.length) {
      return res.status(403).json({ message: 'No documentation sections are available to this user.' });
    }

    const assetBaseUrl =
      process.env.DOCS_PDF_ASSET_BASE_URL ||
      `${req.protocol}://${req.get('host')}`;

    const pdfBuffer = await generateDocsPdf({
      scope,
      sections,
      assetBaseUrl
    });

    const stamp = new Date().toISOString().slice(0, 10);
    const filename =
      scope === 'current'
        ? `KeSMIS-Docs-${sectionId || 'page'}-${stamp}.pdf`
        : `KeSMIS-Docs-${stamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Docs PDF generation failed:', err);
    res.status(500).json({
      message: 'PDF generation failed.'
    });
  }
};
