const express = require('express');
const router = express.Router();
const { getSprints, getActiveSprint, createSprint } = require('../controllers/sprintController');

router.route('/')
  .get(getSprints)
  .post(createSprint);

router.route('/active')
  .get(getActiveSprint);

module.exports = router;

