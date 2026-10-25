import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export const VoiceModal = ({ isOpen, onClose, onProcessVoice, onSaveReviewedTask, sprint, users = [] }) => {
  // Step 1: 'record', Step 2: 'preview'
  const [step, setStep] = useState('record');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  // Preview form state
  const [previewData, setPreviewData] = useState({
    title: '',
    type: 'bug',
    priority: 'P2',
    status: 'todo',
    labels: [],
    assigneeId: '',
    description: '',
    rawTranscript: '',
    aiPowered: false,
  });

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API for direct in-browser microphone capture
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let fullSpeech = '';
        for (let i = 0; i < event.results.length; i++) {
          fullSpeech += event.results[i][0].transcript + ' ';
        }
        setTranscript(fullSpeech.trim());
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission blocked. Please allow mic access in your browser or use Wispr Flow desktop hotkey.');
        } else if (event.error === 'network' || event.error === 'service-not-allowed') {
          setError('Browser speech service is blocked by Brave Shields or browser privacy settings. Please hold your Wispr Flow desktop hotkey to dictate directly.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Handle modal open/close
  useEffect(() => {
    if (isOpen) {
      setStep('record');
      setTranscript('');
      setError(null);
      setIsListening(false);

      // Auto-focus textarea for instant Wispr Flow dictation
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 100);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
    }
  }, [isOpen]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Web Speech API not available. Hold your Wispr Flow desktop push-to-talk hotkey to dictate into the box.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch {}
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const stopMic = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
  };

  // Step 1 ➔ Step 2: Fetch AI Preview
  const handleReviewAI = async () => {
    stopMic();
    if (!transcript.trim()) {
      setError('Please dictate or speak before reviewing.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const res = await api.previewVoiceIntake(transcript.trim(), sprint?._id);
      if (res.success && res.data) {
        setPreviewData({
          title: res.data.title || '',
          type: res.data.type || 'bug',
          priority: res.data.priority || 'P2',
          status: res.data.status || 'todo',
          labels: res.data.labels || [],
          assigneeId: res.data.assigneeId || (res.data.assignee ? res.data.assignee._id : ''),
          description: res.data.description || '',
          rawTranscript: transcript.trim(),
          aiPowered: res.data.aiPowered || false,
        });
        setStep('preview');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to extract AI preview.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct 1-Click Instant Add
  const handleInstantSubmit = async (e) => {
    if (e) e.preventDefault();
    stopMic();
    if (!transcript.trim()) {
      setError('Please dictate or speak before submitting.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      await onProcessVoice(transcript.trim());

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899', '#38bdf8'],
      });

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to process voice transcript.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Confirm Reviewed Task & Save
  const handleConfirmSave = async (e) => {
    if (e) e.preventDefault();
    if (!previewData.title.trim()) {
      setError('Task title cannot be empty.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const taskToCreate = {
        title: previewData.title.trim(),
        type: previewData.type,
        priority: previewData.priority,
        status: previewData.status,
        labels: previewData.labels,
        assignee: previewData.assigneeId || null,
        sprint: sprint ? sprint._id : null,
        description: previewData.description,
        rawTranscript: previewData.rawTranscript,
        source: 'voice-wispr',
      };

      if (onSaveReviewedTask) {
        await onSaveReviewedTask(taskToCreate);
      } else {
        await api.createTask(taskToCreate);
      }

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#10b981', '#38bdf8'],
      });

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save reviewed task.');
    } finally {
      setIsProcessing(false);
    }
  };

  const samplePrompts = [
    {
      label: 'Auth Bug (P0)',
      text: 'Critical bug in auth controller. Token refresh fails with 401 when the user has multiple tabs open simultaneously because refresh token rotation invalidates the first tab cookie. Mark as P0, backend tag, assign to Gourav for Sprint 4.',
    },
    {
      label: 'Feature Request',
      text: 'Build dark mode glassmorphic UI components with smooth drag-and-drop animations for the active sprint. Assign to Sarah Jenkins, priority P2.',
    },
    {
      label: 'Tech Debt (P3)',
      text: 'Tech debt: Optimize database connection pool for concurrent traffic spikes without dropping active WebSockets. Assign to Priya Sharma, priority P3.',
    },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl shadow-indigo-950/50 p-6 z-10 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${
              isListening 
                ? 'bg-rose-600 shadow-rose-600/40 ring-4 ring-rose-500/20 animate-pulse' 
                : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-500/30'
            }`}>
              {step === 'preview' ? (
                <Sliders className="w-5 h-5 text-white" />
              ) : isListening ? (
                <Mic className="w-5 h-5 text-white animate-bounce" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {step === 'preview' ? 'Review & Edit AI Extraction' : 'Voice Ingestion Engine'}
                </h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {step === 'preview' ? 'AI Review Step' : 'Wispr Flow + Live Mic'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {step === 'preview' 
                  ? 'Verify or adjust the fields extracted by Gemini before committing to sprint.' 
                  : isListening 
                    ? '🎙️ Microphone listening... Speak out loud now!' 
                    : 'Click Start Mic or hold your Wispr Flow desktop key to talk.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ---------------- STEP 1: DICTATE & RECORD ---------------- */}
        {step === 'record' && (
          <div className="space-y-4 relative z-10">
            {/* Live Audio Activity Banner */}
            <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
              isListening 
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' 
                : 'bg-purple-950/25 border-purple-500/30 text-purple-200'
            }`}>
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-purple-400'}`} />
                <span className="font-semibold">
                  {isListening 
                    ? '🔴 Browser Mic Active — Listening to Voice...' 
                    : micSupported 
                      ? '🟣 Wispr Flow Ready — Hold your Wispr key & speak!' 
                      : '🟣 Native Wispr Flow Mode — Hold your Wispr hotkey & speak!'}
                </span>
              </div>

              {micSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isListening 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Pause Mic</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Start Browser Mic</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Text Area */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>Dictated Audio Stream</span>
                  {isListening && <span className="text-[10px] text-rose-400 animate-pulse font-mono">(Live Capturing)</span>}
                </label>
                <span className="text-[11px] text-slate-500">
                  Target Sprint: <strong className="text-slate-300">{sprint ? sprint.name : 'Sprint 4'}</strong>
                </span>
              </div>

              <textarea
                ref={textareaRef}
                rows={4}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={isListening 
                  ? "🎙️ Speaking... words will appear here automatically..." 
                  : "Speak into your mic or hold your Wispr Flow key (e.g. 'High severity bug in auth controller, token refresh fails with 401 on multiple tabs, mark P1, assign to Gourav')..."}
                className={`w-full p-3.5 rounded-xl bg-slate-950 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 leading-relaxed transition-all ${
                  isListening 
                    ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500' 
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
            </div>

            {/* Dual Voice Support Info */}
            <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">💡 Dual Voice Support:</span>
                <span>1) Speak freely via browser mic above, OR 2) Hold your Wispr Flow push-to-talk hotkey anywhere!</span>
              </div>
              {transcript && (
                <button 
                  type="button" 
                  onClick={() => setTranscript('')} 
                  className="text-slate-400 hover:text-white underline text-[10px]"
                >
                  Clear Text
                </button>
              )}
            </div>

            {/* Sample Prompts */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                Or Try A Sample Voice Monologue:
              </span>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTranscript(p.text)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 hover:bg-indigo-900/40 border border-slate-700/80 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 transition-colors text-left"
                  >
                    ⚡ {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Footer Controls with 2 Options: Review vs Instant Add */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {/* Instant Add */}
                <button
                  type="button"
                  disabled={isProcessing || !transcript.trim()}
                  onClick={handleInstantSubmit}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 disabled:opacity-50 disabled:pointer-events-none transition-all"
                  title="Directly saves to board with zero review"
                >
                  ⚡ Instant Add
                </button>

                {/* Review & Edit (Recommended) */}
                <button
                  type="button"
                  disabled={isProcessing || !transcript.trim()}
                  onClick={handleReviewAI}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Extracting with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-200" />
                      <span>Review AI Extraction</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- STEP 2: REVIEW & EDIT PREVIEW ---------------- */}
        {step === 'preview' && (
          <form onSubmit={handleConfirmSave} className="space-y-4 relative z-10 max-h-[70vh] overflow-y-auto pr-1">
            
            {/* Title */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Extracted Title
              </label>
              <input
                type="text"
                value={previewData.title}
                onChange={(e) => setPreviewData({ ...previewData, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Type & Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['bug', 'feature', 'refactor', 'debt'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPreviewData({ ...previewData, type: t })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${
                        previewData.type === t
                          ? 'bg-indigo-600/40 text-indigo-200 border-indigo-500/60 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['P0', 'P1', 'P2', 'P3'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPreviewData({ ...previewData, priority: p })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        previewData.priority === p
                          ? p === 'P0' 
                            ? 'bg-rose-500/30 text-rose-300 border-rose-500' 
                            : p === 'P1'
                            ? 'bg-amber-500/30 text-amber-300 border-amber-500'
                            : 'bg-sky-500/30 text-sky-300 border-sky-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Column & Assignee Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Destination Column
                </label>
                <select
                  value={previewData.status}
                  onChange={(e) => setPreviewData({ ...previewData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Assignee
                </label>
                <select
                  value={previewData.assigneeId || ''}
                  onChange={(e) => setPreviewData({ ...previewData, assigneeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags / Labels */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={(previewData.labels || []).join(', ')}
                onChange={(e) =>
                  setPreviewData({
                    ...previewData,
                    labels: e.target.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                placeholder="auth, backend, security"
              />
            </div>

            {/* Generated Markdown Specification */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Generated Markdown Specification
              </label>
              <textarea
                rows={5}
                value={previewData.description}
                onChange={(e) => setPreviewData({ ...previewData, description: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Raw Speech Traceability Box */}
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs">
              <span className="text-[10px] uppercase font-bold text-purple-300 block mb-0.5">
                Original Spoken Monologue (Wispr Flow)
              </span>
              <p className="text-slate-300 italic">"{previewData.rawTranscript}"</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 2 Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('record')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Speech</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving to Board...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Confirm & Add to Board</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
