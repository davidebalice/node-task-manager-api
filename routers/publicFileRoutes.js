const express = require('express');
const clientController = require('../controllers/clientController');
const screenshotController = require('../controllers/screenshotController');
const fileController = require('../controllers/fileController');
const router = express.Router();

// Files loaded directly by the browser (<img> and download links), which cannot send the Authorization header.
// File names are sanitized in the controllers, so only files inside the upload folders can be served.
router.route('/client/img/:filename').get(clientController.clientImg);
router.route('/screenshot/img/:filename').get(screenshotController.screenshotImg);
router.route('/download/:filename').get(fileController.download);

module.exports = router;
