const Sprint = require('../models/Sprint');

// Get all sprints
exports.getSprints = async (req, res) => {
  try {
    const sprints = await Sprint.find().sort({ createdAt: -1 });
    res.json({ success: true, count: sprints.length, data: sprints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current active sprint (or latest)
exports.getActiveSprint = async (req, res) => {
  try {
    let sprint = await Sprint.findOne({ status: 'active' });
    if (!sprint) {
      sprint = await Sprint.findOne().sort({ createdAt: -1 });
    }
    if (!sprint) {
      // Auto-create a default active sprint if database is brand new
      sprint = await Sprint.create({
        name: 'Sprint 1 - Voice Engine MVP',
        goal: 'Build voice intake and real-time kanban workflow with Wispr Flow',
        status: 'active',
      });
    }
    res.json({ success: true, data: sprint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new sprint
exports.createSprint = async (req, res) => {
  try {
    const { name, goal, startDate, endDate, status } = req.body;
    const sprint = await Sprint.create({ name, goal, startDate, endDate, status });
    res.status(201).json({ success: true, data: sprint });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

