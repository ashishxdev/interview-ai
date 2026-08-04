import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Maximize2, Mic, MicOff, RefreshCw, Send, ShieldAlert, ShieldCheck, Volume2, VolumeX, X } from "lucide-react";

import AppLayout from "../components/AppLayout";
import Spinner from "../components/Spinner";
import WebcamPreview from "../components/WebcamPreview";
import QuestionTimer from "../components/QuestionTimer";
import { useInterviewQuestions, useSubmitInterviewAnswer } from "../features/interview/interviewHooks";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { useProctoring } from "../hooks/useProctoring";

const QUESTION_TIME_LIMIT_SECONDS = 120;

function InterviewSession() {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const questionsQuery = useInterviewQuestions(interviewId);
    const submitMutation = useSubmitInterviewAnswer(interviewId);
    const questions = useMemo(() => questionsQuery.data?.questions ?? [], [questionsQuery.data?.questions]);
    const firstUnansweredIndex = questions.findIndex((question) => !question.answer);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const displayIndex =
        questions.length > 0 && questions[currentIndex]?.answer && firstUnansweredIndex !== -1
            ? firstUnansweredIndex
            : Math.min(currentIndex, Math.max(questions.length - 1, 0));

    useEffect(() => {
        if (questions.length === 0) return;

        if (firstUnansweredIndex === -1) {
            navigate(`/interviews/${interviewId}/report`, { replace: true });
        }
    }, [firstUnansweredIndex, interviewId, navigate, questions]);

    const goToIndex = (index) => {
        stopListening();
        setCurrentIndex(index);
        setAnswer("");
    };

    const currentQuestion = questions[displayIndex];
    const answeredCount = questions.filter((question) => question.answer).length;
    const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

    const { supported: ttsSupported, speaking, speak, cancel } = useTextToSpeech();
    const spokenQuestionRef = useRef(null);
    // Track how long the candidate spends on the current question, and the
    // speech-to-text transcript for it, so both can be persisted on submit.
    const questionStartRef = useRef(null);
    const spokenTranscriptRef = useRef("");

    const {
        supported: sttSupported,
        listening,
        interimTranscript,
        error: sttError,
        start: startListening,
        stop: stopListening,
    } = useSpeechToText({
        // Append each finalized speech chunk to the answer (works alongside typing)
        // and keep a separate copy as the raw transcript for this question.
        onFinalTranscript: (chunk) => {
            setAnswer((prev) => (prev ? `${prev} ${chunk}` : chunk));
            spokenTranscriptRef.current = spokenTranscriptRef.current
                ? `${spokenTranscriptRef.current} ${chunk}`
                : chunk;
        },
        // Auto-stop the mic after 4s of silence, so users don't have to click "Stop".
        silenceTimeout: 4000,
    });

    const toggleMic = () => {
        if (listening) {
            stopListening();
            return;
        }
        cancel(); // stop the AI reading before we start listening
        startListening();
    };

    const isAnswering = Boolean(currentQuestion && !currentQuestion.answer);

    const {
        isFullscreen,
        tabSwitchCount,
        fullscreenExitCount,
        violationCount,
        lastViolation,
        enterFullscreen,
        dismissViolation,
    } = useProctoring({ active: isAnswering });

    // Auto-read each new question aloud once (not already-answered ones), and
    // reset the per-question timer + transcript when the question changes.
    useEffect(() => {
        if (!currentQuestion || currentQuestion.answer) return;
        if (spokenQuestionRef.current === currentQuestion.id) return;

        spokenQuestionRef.current = currentQuestion.id;
        questionStartRef.current = Date.now();
        spokenTranscriptRef.current = "";
        speak(currentQuestion.question);
    }, [currentQuestion, speak]);

    // While listening, show interim (not-yet-final) words appended live.
    const answerDisplayValue =
        listening && interimTranscript
            ? `${answer}${answer ? " " : ""}${interimTranscript}`
            : answer;

    const submitAnswer = () => {
        stopListening();

        const startedAt = questionStartRef.current;
        const timeTaken = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : undefined;
        const transcript = spokenTranscriptRef.current || undefined;

        submitMutation.mutate(
            {
                interviewId,
                questionId: currentQuestion.id,
                answer,
                timeTaken,
                transcript,
                tabSwitchCount,
                fullscreenExits: fullscreenExitCount,
            },
            {
                onSuccess: () => {
                    const isLastOpenQuestion = questions.filter((question) => !question.answer).length === 1;

                    if (isLastOpenQuestion) {
                        navigate(`/interviews/${interviewId}/report`);
                        return;
                    }

                    const nextOpenIndex = questions.findIndex(
                        (question, index) => index > displayIndex && !question.answer
                    );
                    goToIndex(nextOpenIndex === -1 ? firstUnansweredIndex : nextOpenIndex);
                },
            }
        );
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        submitAnswer();
    };

    // When a question's time runs out: submit whatever the candidate has, or skip
    // ahead if the answer is empty.
    const handleTimeExpire = () => {
        stopListening();
        if (submitMutation.isPending) return;

        if (answer.trim()) {
            submitAnswer();
        } else {
            const nextOpenIndex = questions.findIndex(
                (question, index) => index > displayIndex && !question.answer
            );
            if (nextOpenIndex !== -1) goToIndex(nextOpenIndex);
        }
    };

    return (
        <AppLayout>
            <div className="mx-auto max-w-6xl">
                {/* Tab-switch / fullscreen-exit warning toast */}
                {lastViolation && isAnswering && (
                    <div className="fixed inset-x-0 top-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 shadow-lg">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800">
                                {lastViolation.type === "tab-switch"
                                    ? "You switched away from the interview"
                                    : "You exited fullscreen"}
                            </p>
                            <p className="mt-0.5 text-xs text-amber-700">
                                This is recorded. Please stay on this tab in fullscreen until you finish.
                                {" "}({violationCount} {violationCount === 1 ? "warning" : "warnings"})
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={dismissViolation}
                            aria-label="Dismiss warning"
                            className="text-amber-600 hover:text-amber-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link to="/interviews" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
                            <ArrowLeft className="h-4 w-4" />
                            History
                        </Link>
                        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Interview session</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAnswering && currentQuestion && (
                            <QuestionTimer
                                key={currentQuestion.id}
                                seconds={QUESTION_TIME_LIMIT_SECONDS}
                                onExpire={handleTimeExpire}
                            />
                        )}
                        {questions.length > 0 && (
                            <span className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                                Question {displayIndex + 1} of {questions.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Prompt to enter fullscreen for a focused, proctored session */}
                {isAnswering && !isFullscreen && (
                    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <Maximize2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                            <div>
                                <p className="text-sm font-semibold text-sky-900">Enter fullscreen mode</p>
                                <p className="mt-0.5 text-xs text-sky-700">
                                    Interviews run in fullscreen. Switching tabs or leaving fullscreen is recorded.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={enterFullscreen}
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
                        >
                            <Maximize2 className="h-4 w-4" />
                            Go fullscreen
                        </button>
                    </div>
                )}

                {questionsQuery.isLoading && (
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
                        <div className="mt-5 h-24 animate-pulse rounded bg-slate-100" />
                        <div className="mt-5 h-40 animate-pulse rounded bg-slate-100" />
                    </div>
                )}

                {questionsQuery.isError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5" />
                            <div>
                                <p className="font-semibold">Could not load interview questions.</p>
                                <button
                                    type="button"
                                    onClick={() => questionsQuery.refetch()}
                                    className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-rose-700 px-3 text-sm font-medium text-white"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!questionsQuery.isLoading && !questionsQuery.isError && currentQuestion && (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white shadow-sm lg:col-span-2">
                        <div className="border-b border-slate-200 p-5">
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                    {currentQuestion.topic || "General"}
                                </span>
                                {currentQuestion.answer && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Answered
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-5 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <p className="text-xl font-semibold leading-relaxed text-slate-950">
                                    {currentQuestion.question}
                                </p>
                                {ttsSupported && (
                                    <button
                                        type="button"
                                        onClick={() => (speaking ? cancel() : speak(currentQuestion.question))}
                                        title={speaking ? "Stop reading" : "Replay question"}
                                        aria-label={speaking ? "Stop reading" : "Replay question"}
                                        className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium ring-1 transition-colors ${
                                            speaking
                                                ? "bg-sky-600 text-white ring-sky-600"
                                                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        {speaking ? (
                                            <>
                                                <VolumeX className="h-5 w-5" />
                                                Stop
                                            </>
                                        ) : (
                                            <>
                                                <Volume2 className="h-5 w-5" />
                                                Replay
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            {speaking && (
                                <p className="flex items-center gap-2 text-xs font-medium text-sky-600">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
                                    </span>
                                    AI is reading the question...
                                </p>
                            )}

                            {currentQuestion.answer ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-medium text-slate-500">Submitted answer</p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                        {currentQuestion.answer.answer}
                                    </p>
                                </div>
                            ) : (
                                <label className="block">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">Your answer</span>
                                        {sttSupported && (
                                            <button
                                                type="button"
                                                onClick={toggleMic}
                                                className={`inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-semibold transition-colors ${
                                                    listening
                                                        ? "bg-rose-600 text-white hover:bg-rose-700"
                                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                }`}
                                            >
                                                {listening ? (
                                                    <>
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                                                        </span>
                                                        Stop recording
                                                        <MicOff className="h-3.5 w-3.5" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mic className="h-3.5 w-3.5" />
                                                        Speak your answer
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        value={answerDisplayValue}
                                        onChange={(event) => setAnswer(event.target.value)}
                                        rows={8}
                                        className={`mt-2 w-full resize-y rounded-lg border p-3 text-sm leading-6 text-slate-950 outline-none focus:ring-2 focus:ring-sky-100 ${
                                            listening ? "border-rose-300 bg-rose-50/40" : "border-slate-300 focus:border-sky-500"
                                        }`}
                                        placeholder="Write your response here, or tap “Speak your answer” to dictate..."
                                        required
                                    />
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                        {listening ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                                                </span>
                                                Listening — speak now
                                            </span>
                                        ) : sttError === "not-allowed" || sttError === "service-not-allowed" ? (
                                            <span className="text-xs font-medium text-rose-600">
                                                Microphone access blocked. Enable it in your browser settings.
                                            </span>
                                        ) : (
                                            <span />
                                        )}
                                        <span className="text-right text-xs font-medium text-slate-500">
                                            {answer.length} characters
                                        </span>
                                    </div>
                                </label>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => goToIndex(Math.max(displayIndex - 1, 0))}
                                    disabled={displayIndex === 0}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => goToIndex(Math.min(displayIndex + 1, questions.length - 1))}
                                    disabled={displayIndex === questions.length - 1 || !currentQuestion.answer}
                                    title={!currentQuestion.answer ? "Submit your answer to continue" : undefined}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>

                            {!currentQuestion.answer && (
                                <button
                                    type="submit"
                                    disabled={submitMutation.isPending || !answer.trim()}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitMutation.isPending ? <Spinner /> : <Send className="h-4 w-4" />}
                                    {submitMutation.isPending ? "Evaluating..." : "Submit answer"}
                                </button>
                            )}
                        </div>
                    </form>

                        <aside className="space-y-4 lg:col-span-1">
                            <WebcamPreview />

                            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Session monitor
                                </p>
                                <ul className="mt-3 space-y-2.5 text-sm">
                                    <li className="flex items-center justify-between">
                                        <span className="text-slate-600">Fullscreen</span>
                                        {isFullscreen ? (
                                            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                                                <ShieldCheck className="h-4 w-4" />
                                                On
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600">
                                                <ShieldAlert className="h-4 w-4" />
                                                Off
                                            </span>
                                        )}
                                    </li>
                                    <li className="flex items-center justify-between">
                                        <span className="text-slate-600">Tab switches</span>
                                        <span className={`font-medium ${tabSwitchCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                                            {tabSwitchCount}
                                        </span>
                                    </li>
                                    <li className="flex items-center justify-between">
                                        <span className="text-slate-600">Total warnings</span>
                                        <span className={`font-medium ${violationCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                                            {violationCount}
                                        </span>
                                    </li>
                                </ul>
                                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                                    Camera is preview-only — nothing is recorded or uploaded.
                                </p>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

export default InterviewSession;
