'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { api, ApiError } from '@/lib/api';
import type {
  SafeQuizQuestion,
  SubmittedAnswer,
  QuizSubmitResult,
  QuizAttempt,
  LeaderboardEntry,
} from '@/types';
import {
  Brain, CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy,
  Loader2, AlertCircle, History, Medal,
} from 'lucide-react';

// ─── API Response Shapes ──────────────────────────────────────────────────────

interface QuestionsResponse {
  success: boolean;
  count:   number;
  data:    { questions: SafeQuizQuestion[] };
}

interface SubmitResponse {
  success: boolean;
  data:    QuizSubmitResult;
}

interface AttemptsResponse {
  success: boolean;
  count:   number;
  data:    { attempts: QuizAttempt[] };
}

interface LeaderboardResponse {
  success: boolean;
  count:   number;
  data:    { leaderboard: LeaderboardEntry[] };
}

// ─── Phase / Tab types ────────────────────────────────────────────────────────

type Phase = 'intro' | 'quiz' | 'submitting' | 'results';
type IntroTab = 'start' | 'history' | 'leaderboard';

// ─── Score helpers ────────────────────────────────────────────────────────────

function resultMessage(pct: number): { text: string; color: string } {
  if (pct >= 90) return { text: 'Excellent! You are well-prepared against cyber threats.', color: 'text-green-400' };
  if (pct >= 70) return { text: 'Good job! Keep building your cybersecurity awareness.', color: 'text-blue-400' };
  if (pct >= 50) return { text: 'Fair. Review the advisories to strengthen your knowledge.', color: 'text-yellow-400' };
  return { text: 'Keep learning! Cybersecurity awareness is crucial for staying safe.', color: 'text-orange-400' };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CyberQuizPage() {
  // ── Questions ───────────────────────────────────────────────────────────────
  const [questions, setQuestions]     = useState<SafeQuizQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError]     = useState('');

  // ── Quiz state ──────────────────────────────────────────────────────────────
  const [phase, setPhase]             = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]         = useState<Record<string, string>>({});   // questionId → selectedId
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');

  // ── Results ─────────────────────────────────────────────────────────────────
  const [result, setResult]           = useState<QuizSubmitResult | null>(null);

  // ── Sidebar tabs ────────────────────────────────────────────────────────────
  const [introTab, setIntroTab]       = useState<IntroTab>('start');
  const [attempts, setAttempts]       = useState<QuizAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading]     = useState(false);

  // ── Fetch questions on mount ────────────────────────────────────────────────
  useEffect(() => {
    void (async () => {
      setQuestionsLoading(true);
      setQuestionsError('');
      try {
        const res = await api.get<QuestionsResponse>('/quiz/questions');
        setQuestions(res.data.questions);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to load quiz questions.';
        setQuestionsError(msg);
      } finally {
        setQuestionsLoading(false);
      }
    })();
  }, []);

  // ── Fetch attempts ───────────────────────────────────────────────────────────
  async function loadAttempts() {
    setAttemptsLoading(true);
    try {
      const res = await api.get<AttemptsResponse>('/quiz/my-attempts');
      setAttempts(res.data.attempts);
    } catch { /* silently fail */ }
    finally { setAttemptsLoading(false); }
  }

  // ── Fetch leaderboard ────────────────────────────────────────────────────────
  async function loadLeaderboard() {
    setLbLoading(true);
    try {
      const res = await api.get<LeaderboardResponse>('/quiz/leaderboard');
      setLeaderboard(res.data.leaderboard);
    } catch { /* silently fail */ }
    finally { setLbLoading(false); }
  }

  function handleTabChange(tab: IntroTab) {
    setIntroTab(tab);
    if (tab === 'history' && attempts.length === 0) void loadAttempts();
    if (tab === 'leaderboard' && leaderboard.length === 0) void loadLeaderboard();
  }

  // ── Quiz actions ─────────────────────────────────────────────────────────────
  const question = questions[currentIndex];
  const isLast   = currentIndex === questions.length - 1;

  function handleOptionSelect(optionId: string) {
    setSelectedOption(optionId);
  }

  function handleNext() {
    if (!selectedOption) return;
    const updated = { ...answers, [question.id]: selectedOption };
    setAnswers(updated);

    if (isLast) {
      void handleSubmit(updated);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    }
  }

  async function handleSubmit(finalAnswers: Record<string, string>) {
    setPhase('submitting');
    setSubmitError('');
    const payload: SubmittedAnswer[] = Object.entries(finalAnswers).map(
      ([questionId, selectedId]) => ({ questionId, selectedId }),
    );
    try {
      const res = await api.post<SubmitResponse>('/quiz/submit', { answers: payload });
      setResult(res.data);
      setPhase('results');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Submission failed. Please try again.';
      setSubmitError(msg);
      setPhase('quiz'); // allow retry
    }
  }

  function handleRestart() {
    setPhase('intro');
    setCurrentIndex(0);
    setAnswers({});
    setSelectedOption(null);
    setResult(null);
    setSubmitError('');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase: loading questions
  // ─────────────────────────────────────────────────────────────────────────────
  if (questionsLoading) {
    return (
      <DashboardLayout title="Cyber Awareness Quiz" subtitle="Test your cybersecurity knowledge">
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="text-purple-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (questionsError) {
    return (
      <DashboardLayout title="Cyber Awareness Quiz" subtitle="Test your cybersecurity knowledge">
        <div className="max-w-lg mx-auto py-16 text-center">
          <div className="flex items-center justify-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{questionsError}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase: intro
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <DashboardLayout title="Cyber Awareness Quiz" subtitle="Test your cybersecurity knowledge">
        <div className="max-w-lg mx-auto py-6">
          {/* Tab buttons */}
          <div className="flex gap-2 mb-6">
            {([['start', Brain, 'Start Quiz'], ['history', History, 'My History'], ['leaderboard', Medal, 'Leaderboard']] as const).map(
              ([tab, Icon, label]) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                    introTab === tab
                      ? 'bg-purple-900/40 border-purple-600/50 text-purple-300'
                      : 'bg-[#111827] border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ),
            )}
          </div>

          {/* ── Start tab ── */}
          {introTab === 'start' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-900/30 border border-purple-700/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain size={28} className="text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Campus Cybersecurity Quiz</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Test your knowledge of phishing, fake internship scams, password safety, QR code fraud
                and social engineering. {questions.length} questions, one answer each.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                  <p className="text-2xl font-bold text-white">{questions.length}</p>
                  <p className="text-xs text-slate-400 mt-1">Questions</p>
                </div>
                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                  <p className="text-2xl font-bold text-white">MCQ</p>
                  <p className="text-xs text-slate-400 mt-1">Format</p>
                </div>
                <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
                  <p className="text-2xl font-bold text-white">∞</p>
                  <p className="text-xs text-slate-400 mt-1">Retakes</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {Array.from(new Set(questions.map((q) => q.category))).map((cat) => (
                  <span key={cat} className="text-xs text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full">
                    {cat}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setPhase('quiz')}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium px-8 py-3 rounded-lg transition-colors"
              >
                Start Quiz
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── History tab ── */}
          {introTab === 'history' && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">My Quiz History</h3>
              {attemptsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="text-purple-400 animate-spin" />
                </div>
              ) : attempts.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-10">No attempts yet. Take the quiz to get started!</p>
              ) : (
                <div className="space-y-2">
                  {attempts.map((att) => (
                    <div key={att._id} className="bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium">{att.score}/{att.totalQuestions} correct</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {att.categoryFilter ?? 'All categories'} · {formatDate(att.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${att.percentage >= 70 ? 'text-green-400' : att.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {att.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Leaderboard tab ── */}
          {introTab === 'leaderboard' && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Top Performers</h3>
              {lbLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="text-purple-400 animate-spin" />
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-10">No attempts on record yet.</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, i) => (
                    <div key={i} className="bg-[#111827] border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className={`text-sm font-bold w-6 text-center flex-shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-500'}`}>
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{entry.fullName}</p>
                        <p className="text-xs text-slate-500">{entry.totalAttempts} attempt{entry.totalAttempts !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-purple-400">{entry.bestPercentage}%</p>
                        <p className="text-xs text-slate-500">{entry.bestScore} correct</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase: submitting
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <DashboardLayout title="Cyber Awareness Quiz" subtitle="Submitting your answers…">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={36} className="text-purple-400 animate-spin" />
          <p className="text-sm text-slate-300">Scoring your answers on the server…</p>
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase: results (server-scored)
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === 'results' && result) {
    const msg = resultMessage(result.percentage);
    return (
      <DashboardLayout title="Quiz Results" subtitle="Your cybersecurity awareness score">
        <div className="max-w-2xl mx-auto py-6">
          {/* Score banner */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-8 text-center mb-6">
            <Trophy size={40} className="text-yellow-400 mx-auto mb-4" />
            <p className="text-5xl font-bold text-white mb-2">{result.percentage}%</p>
            <p className="text-slate-400 text-sm mb-1">
              {result.correctCount} out of {result.totalQuestions} correct
            </p>
            <p className={`text-sm font-medium mt-3 ${msg.color}`}>{msg.text}</p>
          </div>

          {/* Per-question review — data from server response */}
          <div className="space-y-3 mb-6">
            {result.review.map((r, idx) => (
              <div key={r.questionId} className={`bg-[#111827] border rounded-xl p-4 ${r.isCorrect ? 'border-green-700/40' : 'border-red-700/40'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {r.isCorrect ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white mb-2">Q{idx + 1}. {r.questionText}</p>
                    {!r.isCorrect && (
                      <p className="text-xs text-red-300 mb-1">
                        Your answer: <span className="font-medium">
                          {questions.find((q) => q.id === r.questionId)?.options.find((o) => o.id === r.selectedId)?.text ?? r.selectedId}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-green-300 mb-2">
                      {r.isCorrect ? 'Correct: ' : 'Correct answer: '}
                      <span className="font-medium">
                        {questions.find((q) => q.id === r.questionId)?.options.find((o) => o.id === r.correctId)?.text ?? r.correctId}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">{r.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              <RotateCcw size={15} />
              Back to Quiz Home
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase: quiz
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Cyber Awareness Quiz" subtitle={`Question ${currentIndex + 1} of ${questions.length}`}>
      <div className="max-w-2xl mx-auto py-4">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-0.5 rounded-full">{question.category}</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded-full">{question.difficulty}</span>
            </div>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">{submitError}</p>
          </div>
        )}

        {/* Question card */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 mb-4">
          <p className="text-sm font-semibold text-white leading-relaxed mb-6">{question.question}</p>

          <div className="space-y-3">
            {question.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const optionClass = isSelected
                ? 'border-blue-500 bg-blue-900/20 text-white cursor-pointer'
                : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/50 cursor-pointer';

              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={`w-full text-left flex items-start gap-3 border rounded-lg px-4 py-3 text-sm transition-colors ${optionClass}`}
                >
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full border text-xs flex items-center justify-center font-medium mt-0.5 ${isSelected ? 'border-blue-500 text-blue-400 bg-blue-900/40' : 'border-slate-600 text-slate-500'}`}>
                    {option.id.toUpperCase()}
                  </span>
                  {option.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {Object.keys(answers).length} of {questions.length} answered
          </span>
          <button
            onClick={handleNext}
            disabled={!selectedOption}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            {isLast ? 'Submit Quiz' : 'Next Question'}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
