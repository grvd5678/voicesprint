# 🎙️ VoiceSprint — Voice-Driven Kanban & Bug Intake

> **WeMakeDevs × Wispr Flow Hackathon Project**  
> *"Frictionless Bug-to-Sprint Intake for Developers"*

VoiceSprint is an engineering-first Agile sprint and Kanban platform that eliminates the painful context-switching of filing bug tickets and tasks. By leveraging **Wispr Flow** speech-to-text dictation and **Google Gemini / NLP Entity Parsing**, developers can stay focused in their code, speak out their stream of thought, and watch fully structured, prioritized, tagged tickets appear in real time across the team's Kanban board.

---

## 🌟 Key Features

1. **🎙️ Wispr Flow Voice Ingestion Modal (`Alt+V`):**
   - Speak naturally into Wispr Flow: *"Critical bug in auth controller, token refresh fails with 401 when multiple tabs open, mark P1, assign to Gourav for Sprint 4."*
   - Real-time animated sound-wave visualizer and sample prompts for instant testing.

2. **🧠 AI-Powered Task Structuring:**
   - Extracts: **Title**, **Type** (`bug` / `feature` / `refactor` / `debt`), **Priority** (`P0` / `P1` / `P2` / `P3`), **Labels** (`auth`, `backend`, `security`), and **Assignee matching** (matches "Gourav", "Alex", "Sarah", "Priya").
   - Auto-generates clean **Markdown Specifications** (Observed Context, Technical Hypothesis, and Action Items Checklist).

3. **⚡ Real-Time Socket.io Synchronization:**
   - When a ticket is created via voice, it instantly animates onto the board for everyone with zero page refreshes.
   - Live broadcast toast displays newly ingested tickets.

4. **📋 Drag-and-Drop Agile Kanban:**
   - Columns: `Backlog` ➔ `To Do` ➔ `In Progress` ➔ `In Review` ➔ `Done`.
   - Confetti celebration when a task lands in **Done**!
   - Priority badges, P0 blocker pulsating beacon, filter by keyword, tag, priority, or assignee.

5. **📑 Task Drawer & One-Click GitHub Export:**
   - Inspect the exact raw audio transcript from Wispr Flow.
   - One-click copy formatted Markdown for GitHub Issues or Linear.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti, Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io (WebSockets)
- **Database:** MongoDB, Mongoose
- **AI & Speech Ingestion:** Wispr Flow (Voice Input) + Google Gemini API (`@google/genai`)

---

## 🚀 How to Run Locally

### 1. Start the Backend Server (Port 5000)
```powershell
cd server
npm install
npm run seed     # Pre-populates Sprint 4, team members, and starter tasks
npm run dev      # or: node server.js
```

### 2. Start the Frontend Client (Port 3000)
Open a second terminal window:
```powershell
cd client
npm install
npm run dev
```

Open **`http://localhost:3000`** in your browser!

### 3. Using Wispr Flow
- Open the **VoiceSprint** dashboard at `http://localhost:3000`.
- Click the purple **"🎙️ Voice Dictate"** button or hit **`Alt+V`**.
- Hold your **Wispr Flow** desktop hotkey and speak your bug or feature.
- Click **Review AI Extraction** to preview the Gemini 3.5 Flash structured spec, or **Instant Add**!

---

## 👥 Engineering Team Pre-Configured

- **Gourav Das** — MLOps Engineer (GD)
- **Alex Chen** — Backend Architect (AC)
- **Sarah Jenkins** — Frontend & UI Specialist (SJ)
- **Priya Sharma** — Site Reliability Engineer (PS)
- **Elena Lindqvist** — Senior DevOps (EL)
- **Rohan Desai** — QA Engineer & Designer (RD)

---

## 🏆 Hackathon Submission Checklist

- [x] Full-Stack MERN Architecture with WebSockets (Express 5 + React 19 + MongoDB)
- [x] Deep Wispr Flow voice dictation integration
- [x] Google Gemini 3.5 Flash strict JSON schema entity extraction
- [x] Human-in-the-Loop interactive AI review modal with confidence tags
- [x] Real-time bi-directional collaborative Kanban board synchronization
- [x] GitHub Issue Markdown specification export
- [x] Wispr Flow usage verification (Flow Pro Desktop Insights)

