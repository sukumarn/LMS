"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, TimerReset, X, Trophy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuizOption = "A" | "B" | "C" | "D";

type Question = {
  id: string;
  question: string;
  options: Record<QuizOption, string>;
  correctOption: QuizOption;
  position: number;
};

type QuizMeta = {
  id: string;
  title: string;
  description: string | null;
  questionCount: number;
  timeLimitMinutes: number;
  passPercentage: number;
};

type Props = {
  lessonId: string;
  quizTitle: string;
  apiPath?: string;
  questionLimit?: number;
  onClose: () => void;
};

type Phase = "loading" | "error" | "ready" | "playing" | "result";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizPlayer({ lessonId, quizTitle, apiPath, questionLimit, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [quiz, setQuiz] = useState<QuizMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuizOption>>({});
  const [selected, setSelected] = useState<QuizOption | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [fetchKey, setFetchKey] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    fetch(apiPath ?? `/api/lessons/${lessonId}/quiz`)
      .then((r) => {
        if (r.status === 404) throw new Error("No quiz has been set up for this lesson yet.");
        if (!r.ok) throw new Error("Failed to load quiz. Please try again.");
        return r.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const allQuestions: Question[] = data.questions;
        const picked = questionLimit
          ? shuffle(allQuestions).slice(0, questionLimit)
          : allQuestions;
        const timePerQuestion = questionLimit && data.quiz
          ? Math.ceil((data.quiz.timeLimitMinutes / allQuestions.length) * picked.length)
          : data.quiz?.timeLimitMinutes ?? 10;
        setQuiz({ ...data.quiz, questionCount: picked.length, timeLimitMinutes: timePerQuestion });
        setQuestions(picked);
        setTimeLeft(timePerQuestion * 60);
        setPhase("ready");
      })
      .catch((err) => { setError(err.message ?? "Failed to load quiz."); setPhase("error"); });
  }, [lessonId, fetchKey]);

  const finishQuiz = useCallback(() => {
    setPhase("result");
    setAttemptKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (attemptKey === 0 || !quiz || questions.length === 0) return;
    const correctCount = questions.filter((q, i) => answers[i] === q.correctOption).length;
    const sc = Math.round((correctCount / questions.length) * 100);
    const timeTaken = quiz.timeLimitMinutes * 60 - timeLeft;
    fetch("/api/quiz-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId: (quiz as any).id ?? null,
        scorePercent: sc,
        passed: sc >= quiz.passPercentage,
        questionCount: questions.length,
        correctCount,
        timeTakenSeconds: timeTaken,
        isSimulated: !!questionLimit
      })
    }).catch(() => null);
  }, [attemptKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) { finishQuiz(); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, finishQuiz]);

  function startQuiz() {
    setCurrent(0);
    setAnswers({});
    setSelected(null);
    setConfirmed(false);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }

  function confirmAnswer() {
    if (!selected) return;
    setAnswers((prev) => ({ ...prev, [current]: selected }));
    setConfirmed(true);
  }

  function nextQuestion() {
    if (current + 1 >= questions.length) { finishQuiz(); return; }
    setCurrent((c) => c + 1);
    setSelected(null);
    setConfirmed(false);
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const score = questions.length
    ? Math.round((questions.filter((q, i) => answers[i] === q.correctOption).length / questions.length) * 100)
    : 0;
  const passed = quiz ? score >= quiz.passPercentage : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-[28px] border border-white/10 bg-background p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-5 top-5 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        {phase === "loading" && (
          <div className="py-16 text-center text-muted-foreground">Loading quiz...</div>
        )}

        {phase === "error" && (
          <div className="py-12 text-center space-y-4">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
            <div>
              <p className="font-semibold">Could not load quiz</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { setPhase("loading"); setError(""); setFetchKey((k) => k + 1); }}>Retry</Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}

        {phase === "ready" && quiz && (
          <div className="space-y-6 py-4 text-center">
            <Trophy className="mx-auto h-12 w-12 text-amber-400" />
            <div>
              <p className="text-2xl font-semibold">{quiz.title}</p>
              {quiz.description && <p className="mt-2 text-sm text-muted-foreground">{quiz.description}</p>}
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/50 p-3 dark:bg-white/5">
                <p className="text-muted-foreground">Questions</p>
                <p className="mt-1 text-xl font-semibold">{questions.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/50 p-3 dark:bg-white/5">
                <p className="text-muted-foreground">Time limit</p>
                <p className="mt-1 text-xl font-semibold">{quiz.timeLimitMinutes} min</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/50 p-3 dark:bg-white/5">
                <p className="text-muted-foreground">Pass mark</p>
                <p className="mt-1 text-xl font-semibold">{quiz.passPercentage}%</p>
              </div>
            </div>
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No questions have been added to this quiz yet.</p>
            ) : (
              <Button className="w-full" onClick={startQuiz}>Start quiz</Button>
            )}
          </div>
        )}

        {phase === "playing" && questions.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Question {current + 1} of {questions.length}</p>
              <div className={cn("flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium", timeLeft <= 30 ? "bg-rose-500/20 text-rose-400" : "bg-white/10 text-muted-foreground")}>
                <TimerReset className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="h-1 w-full rounded-full bg-white/10">
              <div className="h-1 rounded-full bg-primary transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>

            {(questions[current] as any).lessonTitle && (
              <p className="text-xs text-muted-foreground">From: {(questions[current] as any).lessonTitle}</p>
            )}
            <p className="text-lg font-semibold">{questions[current].question}</p>

            <div className="space-y-3">
              {(["A", "B", "C", "D"] as QuizOption[]).map((letter) => {
                const isCorrect = questions[current].correctOption === letter;
                const isSelected = selected === letter;
                return (
                  <button
                    key={letter}
                    disabled={confirmed}
                    onClick={() => setSelected(letter)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition",
                      confirmed && isCorrect ? "border-emerald-400 bg-emerald-400/10 text-emerald-400" :
                      confirmed && isSelected && !isCorrect ? "border-rose-400 bg-rose-400/10 text-rose-400" :
                      isSelected ? "border-primary bg-primary/10" :
                      "border-white/10 bg-white/40 hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10"
                    )}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">{letter}</span>
                    <span className="flex-1">{questions[current].options[letter]}</span>
                    {confirmed && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                    {confirmed && isSelected && !isCorrect && <XCircle className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              {!confirmed ? (
                <Button className="flex-1" disabled={!selected} onClick={confirmAnswer}>Confirm answer</Button>
              ) : (
                <Button className="flex-1" onClick={nextQuestion}>
                  {current + 1 >= questions.length ? "Finish quiz" : "Next question"}
                </Button>
              )}
            </div>
          </div>
        )}

        {phase === "result" && quiz && (
          <div className="space-y-6 py-4 text-center">
            {passed ? (
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
            ) : (
              <XCircle className="mx-auto h-14 w-14 text-rose-400" />
            )}
            <div>
              <p className="text-3xl font-bold">{score}%</p>
              <p className={cn("mt-1 text-lg font-semibold", passed ? "text-emerald-400" : "text-rose-400")}>
                {passed ? "Passed!" : "Not passed"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                You answered {questions.filter((q, i) => answers[i] === q.correctOption).length} of {questions.length} questions correctly.
                Pass mark was {quiz.passPercentage}%.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={startQuiz}>Retry quiz</Button>
              <Button className="flex-1" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
