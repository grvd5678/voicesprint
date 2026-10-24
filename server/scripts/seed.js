require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');

const seedData = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voicesprint';
    await mongoose.connect(mongoURI);
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing collections
    await Task.deleteMany({});
    await Sprint.deleteMany({});
    await User.deleteMany({});
    console.log('[Seed] Cleared existing data...');

    // 1. Seed 6 Team Members
    const users = await User.create([
      {
        name: 'Gourav Das',
        email: 'gouravdas350@gmail.com',
        role: 'MLOps Engineer',
        initials: 'GD',
        aliases: ['gourav', 'das', 'mlops', 'ai', 'lead', 'me'],
      },
      {
        name: 'Alex Chen',
        email: 'alex.chen@voicesprint.dev',
        role: 'Backend Architect',
        initials: 'AC',
        aliases: ['alex', 'chen', 'backend'],
      },
      {
        name: 'Sarah Jenkins',
        email: 'sarah.j@voicesprint.dev',
        role: 'Frontend & UI Specialist',
        initials: 'SJ',
        aliases: ['sarah', 'jenkins', 'frontend', 'ui'],
      },
      {
        name: 'Priya Sharma',
        email: 'priya.s@voicesprint.dev',
        role: 'SRE',
        initials: 'PS',
        aliases: ['priya', 'sharma', 'sre'],
      },
      {
        name: 'Elena Lindqvist',
        email: 'elena.l@voicesprint.dev',
        role: 'Senior DevOps',
        initials: 'EL',
        aliases: ['elena', 'lindqvist', 'devops'],
      },
      {
        name: 'Rohan Desai',
        email: 'rohan.d@voicesprint.dev',
        role: 'QA Engineer & Designer',
        initials: 'RD',
        aliases: ['rohan', 'desai', 'qa', 'designer', 'testing'],
      },
    ]);
    console.log(`[Seed] Created ${users.length} team members.`);

    // 2. Seed Sprints
    const activeSprint = await Sprint.create({
      name: 'Sprint 4 - Real-Time Voice & Flow',
      goal: 'Integrate Wispr voice capture, entity extraction, and live socket sync',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    });

    const plannedSprint = await Sprint.create({
      name: 'Sprint 5 - GitHub CI/CD & Production Polish',
      goal: 'Two-way GitHub issues synchronization and performance audits',
      status: 'planned',
      startDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    });
    console.log(`[Seed] Created 2 sprints (Active: "${activeSprint.name}")`);

    // 3. Seed Starter Tasks for Team Members
    const tasks = [
      {
        title: 'Auth Controller: Token refresh race condition on multiple tabs',
        description: `### Observed Issue
When opening two browser tabs simultaneously, rotating the refresh token in Tab 1 causes Tab 2's API calls to immediately fail with HTTP 401 Unauthorized.

### Root Cause Hypothesis
Token rotation invalidates the prior refresh token on the very first hit without a grace period window for concurrent in-flight requests.

### Action Items
- [ ] Implement a 30-second grace period for valid rotated tokens in Redis / MongoDB.
- [ ] Add client-side request deduplication in axios interceptors.`,
        rawTranscript: 'Critical bug in auth controller. Token refresh fails with 401 when the user has multiple tabs open simultaneously because refresh token rotation invalidates the first tab cookie. Mark as P1, backend tag, assign to Gourav for Sprint 4.',
        type: 'bug',
        priority: 'P1',
        status: 'todo',
        labels: ['backend', 'auth', 'security'],
        assignee: users[0]._id, // Gourav
        sprint: activeSprint._id,
        order: 0,
        source: 'voice-wispr',
      },
      {
        title: 'Wispr Flow Voice Ingestion API & Streaming Endpoint',
        description: `### Goal
Expose an asynchronous endpoint to receive transcribed speech fragments directly from Wispr Flow hotkey capture and trigger the Gemini extraction pipeline.

### Acceptance Criteria
- Latency under 800ms for full task extraction.
- Automatic fallback if API quota or offline.`,
        rawTranscript: 'Feature: Wispr Flow voice ingestion API and streaming endpoint. Assign to Alex Chen, P1 priority.',
        type: 'feature',
        priority: 'P1',
        status: 'in_progress',
        labels: ['api', 'voice', 'gemini'],
        assignee: users[1]._id, // Alex
        sprint: activeSprint._id,
        order: 1,
        source: 'voice-wispr',
      },
      {
        title: 'Dark-mode glassmorphic Kanban Board styling & animations',
        description: `### Design Specs
Implement Tailwind CSS styling with smooth drag-and-drop transitions, glassmorphic cards, and animated badge indicators for P0 blocker tickets.`,
        rawTranscript: 'Frontend task for Sarah. Build the dark mode glassmorphic Kanban board layout with priority pill badges.',
        type: 'feature',
        priority: 'P2',
        status: 'in_review',
        labels: ['frontend', 'ui', 'tailwind'],
        assignee: users[2]._id, // Sarah
        sprint: activeSprint._id,
        order: 0,
        source: 'voice-wispr',
      },
      {
        title: 'Database connection pool optimization for concurrent spikes',
        description: `Ensure Mongoose connection options handle burst traffic and automatic reconnects without dropping active WebSocket subscriptions.`,
        rawTranscript: 'Tech debt: optimize mongo connection pooling under high load. Assign to Priya.',
        type: 'debt',
        priority: 'P3',
        status: 'backlog',
        labels: ['database', 'devops', 'performance'],
        assignee: users[3]._id, // Priya
        sprint: activeSprint._id,
        order: 0,
        source: 'voice-wispr',
      },
      {
        title: 'CI/CD Pipeline: Automated container security scanning with Trivy',
        description: `### Specification
Integrate Trivy vulnerability scanner into GitHub Actions workflow to scan Docker image layers before deployment. Alert team if CVE severity is High or Critical.`,
        rawTranscript: 'DevOps feature for Elena. Setup automated container security scanning in CI/CD pipeline.',
        type: 'feature',
        priority: 'P2',
        status: 'todo',
        labels: ['devops', 'cicd', 'security'],
        assignee: users[4]._id, // Elena
        sprint: activeSprint._id,
        order: 1,
        source: 'voice-wispr',
      },
      {
        title: 'Automated Playwright E2E test suite for VoiceModal flow',
        description: `### Scope
Write End-to-End tests verifying keyboard shortcuts (Alt+V), voice review card transitions, and drag-and-drop reordering with persistent order assertions.`,
        rawTranscript: 'QA task for Rohan. Build the Playwright E2E test suite for the voice modal and Kanban board.',
        type: 'task',
        priority: 'P2',
        status: 'in_progress',
        labels: ['qa', 'testing', 'playwright'],
        assignee: users[5]._id, // Rohan
        sprint: activeSprint._id,
        order: 0,
        source: 'voice-wispr',
      },
    ];

    await Task.create(tasks);
    console.log(`[Seed] Created ${tasks.length} starter tasks on the board.`);

    console.log('[Seed] Database successfully seeded! Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
