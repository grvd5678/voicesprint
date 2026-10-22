const Task = require('../models/Task');

// Get all tasks, optionally filtered by sprint
exports.getTasks = async (req, res) => {
  try {
    const { sprintId, status, priority, type } = req.query;
    const filter = {};

    if (sprintId) filter.sprint = sprintId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email role initials avatar')
      .populate('sprint', 'name status')
      .sort({ order: 1, createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email role initials avatar')
      .populate('sprint', 'name status');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a task manually (or fallback)
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email role initials avatar')
      .populate('sprint', 'name status');

    // Broadcast real-time event if Socket.io is initialized
    const io = req.app.get('io');
    if (io) {
      io.emit('TASK_CREATED', populated);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update task (status, order, priority, description, etc.)
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignee', 'name email role initials avatar')
      .populate('sprint', 'name status');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('TASK_UPDATED', task);
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Batch update task status/order (for drag-and-drop in Kanban)
exports.batchUpdatePositions = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, status, order }
    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: 'updates must be an array' });
    }

    const bulkOps = updates.map((u) => ({
      updateOne: {
        filter: { _id: u.id },
        update: { $set: { status: u.status, order: u.order } },
      },
    }));

    await Task.bulkWrite(bulkOps);

    const io = req.app.get('io');
    if (io) {
      io.emit('BOARD_REORDERED', updates);
    }

    res.json({ success: true, message: 'Tasks reordered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('TASK_DELETED', { id: req.params.id });
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

