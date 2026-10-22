const User = require('../models/User');

// Get all users / team members
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new team member
exports.createUser = async (req, res) => {
  try {
    const { name, email, role, avatar, aliases } = req.body;
    const user = await User.create({ name, email, role, avatar, aliases });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

