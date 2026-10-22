const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  batchUpdatePositions,
  deleteTask,
} = require('../controllers/taskController');

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/batch-positions')
  .put(batchUpdatePositions);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;

