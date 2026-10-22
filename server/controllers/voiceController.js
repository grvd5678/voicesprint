const Task = require('../models/Task');
const Sprint = require('../models/Sprint');
const User = require('../models/User');
const { parseVoiceTranscript } = require('../utils/geminiParser');

/**
 * Handle incoming voice dictation from Wispr Flow
 * Endpoint: POST /api/voice/intake
 * Body: { transcript: string, sprintId?: string }
 */
exports.handleVoiceIntake = async (req, res) => {
  try {
    const { transcript, sprintId } = req.body;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty "transcript" string is required',
      });
    }

    // 1. Resolve sprint (provided or active sprint)
    let sprint;
    if (sprintId) {
      sprint = await Sprint.findById(sprintId);
    }
    if (!sprint) {
      sprint = await Sprint.findOne({ status: 'active' });
    }
    if (!sprint) {
      sprint = await Sprint.findOne().sort({ createdAt: -1 });
    }

    // 2. Load available users for assignee matching
    const users = await User.find();

    // 3. Parse voice transcript with Gemini (or heuristic fallback)
    const parsed = await parseVoiceTranscript(transcript, users);

    // 4. Match assignee ID
    let assigneeId = null;
    if (parsed.targetAssignee) {
      const targetLower = parsed.targetAssignee.toLowerCase();
      const matched = users.find((u) => {
        if (u.name.toLowerCase().includes(targetLower)) return true;
        return (u.aliases || []).some((alias) => alias.toLowerCase() === targetLower);
      });
      if (matched) {
        assigneeId = matched._id;
      }
    }

    // 5. Determine order in column (place on top)
    const taskCountInColumn = await Task.countDocuments({
      status: parsed.status,
      sprint: sprint ? sprint._id : null,
    });

    // 6. Create the task in MongoDB
    const newTask = await Task.create({
      title: parsed.title,
      description: parsed.markdownDescription,
      rawTranscript: transcript,
      type: parsed.type,
      priority: parsed.priority,
      status: parsed.status,
      labels: parsed.labels || [],
      assignee: assigneeId,
      sprint: sprint ? sprint._id : null,
      order: taskCountInColumn,
      source: 'voice-wispr',
    });

    // 7. Populate relations for real-time broadcast & response
    const populated = await Task.findById(newTask._id)
      .populate('assignee', 'name email role initials avatar')
      .populate('sprint', 'name status');

    // 8. Broadcast over WebSockets via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('TASK_CREATED', populated);
      io.emit('VOICE_INTAKE_SUCCESS', {
        id: populated._id,
        title: populated.title,
        priority: populated.priority,
        status: populated.status,
        assignee: populated.assignee ? populated.assignee.name : 'Unassigned',
        aiPowered: parsed.aiPowered,
      });
    }

    res.status(201).json({
      success: true,
      data: populated,
      meta: {
        aiPowered: parsed.aiPowered,
        rawTranscript: transcript,
      },
    });
  } catch (error) {
    console.error('[Voice Intake Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process voice transcript',
    });
  }
};

/**
 * Parse and preview voice transcript WITHOUT saving to database
 * Endpoint: POST /api/voice/preview
 * Body: { transcript: string, sprintId?: string }
 */
exports.previewVoiceIntake = async (req, res) => {
  try {
    const { transcript, sprintId } = req.body;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A non-empty "transcript" string is required',
      });
    }

    let sprint;
    if (sprintId) {
      sprint = await Sprint.findById(sprintId);
    }
    if (!sprint) {
      sprint = await Sprint.findOne({ status: 'active' });
    }

    const users = await User.find();
    const parsed = await parseVoiceTranscript(transcript, users);

    let assigneeId = null;
    let matchedUser = null;
    if (parsed.targetAssignee) {
      const targetLower = parsed.targetAssignee.toLowerCase();
      matchedUser = users.find((u) => {
        if (u.name.toLowerCase().includes(targetLower)) return true;
        return (u.aliases || []).some((alias) => alias.toLowerCase() === targetLower);
      });
      if (matchedUser) {
        assigneeId = matchedUser._id;
      }
    }

    res.json({
      success: true,
      data: {
        title: parsed.title,
        description: parsed.markdownDescription,
        rawTranscript: transcript,
        type: parsed.type,
        priority: parsed.priority,
        status: parsed.status,
        labels: parsed.labels || [],
        assignee: matchedUser || null,
        assigneeId: assigneeId,
        sprint: sprint || null,
        source: 'voice-wispr',
        aiPowered: parsed.aiPowered,
      },
    });
  } catch (error) {
    console.error('[Voice Preview Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to preview voice transcript',
    });
  }
};

