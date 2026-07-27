const express = require('express');
const multer = require('multer');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/BrandingController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/public', ctrl.publicBranding);
router.get('/status', ctrl.getStatus);
router.get('/docs', ctrl.getApiDocs);
router.get('/', requireJwtAuth, ctrl.getBrandingConfig);
router.put('/', requireJwtAuth, ctrl.updateBranding);
router.post('/upload/:type', requireJwtAuth, upload.single('file'), ctrl.uploadImage);
router.post('/verify-domain', requireJwtAuth, ctrl.verifyDomain);
router.get('/ssl-status', requireJwtAuth, ctrl.checkSSLStatus);
router.delete('/:organizationId', requireJwtAuth, ctrl.resetBranding);

module.exports = router;
