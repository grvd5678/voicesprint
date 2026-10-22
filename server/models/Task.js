const mongoose = require('mongoose');
require('./User');
require('./Sprint');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    rawTranscript: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['bug', 'feature', 'refactor', 'task', 'debt'],
      default: 'bug',
    },
    priority: {
      type: String,
      enum: ['P0', 'P1', 'P2', 'P3'],
      default: 'P2',
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
    },
    labels: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ['voice-wispr', 'manual', 'imported'],
      default: 'voice-wispr',
    },
  },
  { timestamps: true }
);

// Indexing for faster retrieval by sprint and status
TaskSchema.index({ sprint: 1, status: 1, order: 1 });

module.exports = mongoose.model('Task', TaskSchema);
