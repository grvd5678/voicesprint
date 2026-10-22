const express = require('express');
const router = express.Router();
const { handleVoiceIntake, previewVoiceIntake } = require('../controllers/voiceController');

router.post('/intake', handleVoiceIntake);
router.post('/preview', previewVoiceIntake);

module.exports = router;

