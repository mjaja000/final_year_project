const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const FeedbackController = require('../controllers/feedbackController');
const { authMiddleware, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'feedback-evidence');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadsDir),
	filename: (req, file, cb) => {
		const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
		cb(null, `${Date.now()}_${safeName}`);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 20 * 1024 * 1024 },
});

// Public routes (for dashboard)
router.get('/', FeedbackController.getAllPublic);
router.post('/', FeedbackController.submitFeedback);
router.post('/evidence', upload.array('files', 5), FeedbackController.uploadEvidence);
router.get('/:feedbackId', FeedbackController.getFeedbackById);

// Protected routes
router.use(authMiddleware);

// Delete feedback
router.delete('/:feedbackId', FeedbackController.deleteFeedback);

// Admin routes
router.get('/admin/ntsa-stats', authorizeRoles('admin'), FeedbackController.getNTSAStats);
router.post('/admin/ntsa-forward/:feedbackId', authorizeRoles('admin'), FeedbackController.forwardToNTSA);
router.post('/admin/whatsapp/:feedbackId/:phoneNumber', authorizeRoles('admin'), FeedbackController.sendFeedbackWhatsApp);
router.post('/admin/whatsapp/:feedbackId', authorizeRoles('admin'), FeedbackController.sendFeedbackWhatsApp);

module.exports = router;
