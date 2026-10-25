const { GoogleGenAI, Type } = require('@google/genai');

/**
 * Intelligent AI voice entity extractor using Google Gemini.
 * Features automatic heuristic fallback when offline or if GEMINI_API_KEY is not configured.
 */
async function parseVoiceTranscript(rawTranscript, availableUsers = []) {
  if (!rawTranscript || typeof rawTranscript !== 'string') {
    throw new Error('rawTranscript string is required');
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const userListStr = availableUsers
        .map((u) => `${u.name} (aliases: ${(u.aliases || []).join(', ')})`)
        .join('; ');

      const systemPrompt = `You are an expert Agile Scrum & Engineering Lead AI. 
A software engineer spoke a raw thought/bug into Wispr Flow. 
Your task is to parse this spoken monologue into an engineering-grade Jira/Linear ticket specification.

Available team members to assign:
${userListStr || 'Gourav Das, Alex Chen, Sarah Jenkins, Priya Sharma'}

Rules:
1. title: Clean, professional, 5-10 words summarizing the issue.
2. type: 'bug' | 'feature' | 'refactor' | 'task' | 'debt'
3. priority: 'P0' (Blocker/Outage) | 'P1' (Critical/High) | 'P2' (Normal/Medium) | 'P3' (Low)
4. status: 'todo' by default, or 'backlog' / 'in_progress' if explicitly stated.
5. labels: 2 to 4 relevant engineering tags (e.g., ['backend', 'auth', 'security', 'database', 'frontend', 'ui']).
6. targetAssignee: Name of the team member mentioned in the voice text (or empty string if none).
7. markdownDescription: Well-structured Markdown containing:
   - ### Observed Context
   - ### Root Cause / Technical Hypothesis
   - ### Recommended Action Items (bulleted checklists)`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Spoken transcript from Wispr Flow: "${rawTranscript}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseJsonSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: {
                  type: Type.STRING,
                  enum: ['bug', 'feature', 'refactor', 'task', 'debt'],
                },
                priority: {
                  type: Type.STRING,
                  enum: ['P0', 'P1', 'P2', 'P3'],
                },
                status: {
                  type: Type.STRING,
                  enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
                },
                labels: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                targetAssignee: { type: Type.STRING },
                markdownDescription: { type: Type.STRING },
              },
              required: ['title', 'type', 'priority', 'status', 'labels', 'markdownDescription'],
            },
          },
        });
      } catch (err35) {
        // Fallback to gemini-3.8-flash if temporary load spike
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Spoken transcript from Wispr Flow: "${rawTranscript}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });
      }

      const parsed = JSON.parse(response.text);
      return {
        ...parsed,
        source: 'voice-wispr',
        aiPowered: true,
      };
    } catch (err) {
      console.warn(`[Gemini Parser] API call failed (${err.message}). Falling back to heuristic parser.`);
    }
  }

  // --- Robust Heuristic NLP Fallback ---
  return heuristicParser(rawTranscript, availableUsers);
}

/**
 * Rule-based heuristic parser for instant response without API keys or offline use.
 */
function heuristicParser(text, availableUsers = []) {
  const lower = text.toLowerCase();

  // Detect Type
  let type = 'task';
  if (/bug|error|fail|crash|exception|401|500|broken|issue/i.test(text)) type = 'bug';
  else if (/feature|build|create|add|implement|new/i.test(text)) type = 'feature';
  else if (/refactor|clean|restructure|optimize/i.test(text)) type = 'refactor';
  else if (/debt|deprecated|migrate/i.test(text)) type = 'debt';

  // Detect Priority
  let priority = 'P2';
  if (/p0|critical|blocker|emergency|urgent|production down/i.test(lower)) priority = 'P0';
  else if (/p1|high priority|important/i.test(lower)) priority = 'P1';
  else if (/p3|low priority|minor|someday/i.test(lower)) priority = 'P3';

  // Detect Status
  let status = 'todo';
  if (/in progress|working on|started/i.test(lower)) status = 'in_progress';
  else if (/backlog|later|postpone/i.test(lower)) status = 'backlog';

  // Detect Labels
  const potentialLabels = ['auth', 'backend', 'frontend', 'database', 'security', 'api', 'ui', 'devops', 'performance'];
  const labels = potentialLabels.filter((lbl) => lower.includes(lbl));
  if (labels.length === 0) labels.push('engineering');

  // Detect Assignee from available users
  let targetAssignee = '';
  for (const user of availableUsers) {
    const names = [user.name.toLowerCase(), ...(user.aliases || []).map((a) => a.toLowerCase())];
    if (names.some((n) => lower.includes(n))) {
      targetAssignee = user.name;
      break;
    }
  }

  // Generate Title
  // Clean first sentence or up to 60 chars
  const firstSentence = text.split(/[.?!]/)[0].trim();
  const title = firstSentence.length > 70 ? firstSentence.slice(0, 67) + '...' : firstSentence;

  // Generate Markdown
  const markdownDescription = `### Spoken Context
${text}

### Categorization
- **Detected Priority**: ${priority}
- **Module Tags**: ${labels.join(', ')}

### Recommended Action Items
- [ ] Reproduce the issue or review requirements from the transcript.
- [ ] Implement required unit/integration tests.
- [ ] Create pull request linked to this ticket.`;

  return {
    title: title || 'Voice Ingested Task',
    type,
    priority,
    status,
    labels,
    targetAssignee,
    markdownDescription,
    source: 'voice-wispr',
    aiPowered: false,
  };
}

module.exports = { parseVoiceTranscript };

