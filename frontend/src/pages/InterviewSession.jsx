import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, Send } from "lucide-react";

import AppLayout from "../components/AppLayout";
import Spinner from "../components/Spinner";
import { useInterviewQuestions, useSubmitInterviewAnswer } from "../features/interview/interviewHooks";

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
        setCurrentIndex(index);
        setAnswer("");
    };

    const currentQuestion = questions[displayIndex];
    const answeredCount = questions.filter((question) => question.answer).length;
    const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

    const handleSubmit = (event) => {
        event.preventDefault();

        submitMutation.mutate(
            {
                interviewId,
                questionId: currentQuestion.id,
                answer,
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

    return (
        <AppLayout>
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link to="/interviews" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
                            <ArrowLeft className="h-4 w-4" />
                            History
                        </Link>
                        <h1 className="mt-3 text-2xl font-semibold text-slate-950">Interview session</h1>
                    </div>
                    {questions.length > 0 && (
                        <span className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                            Question {displayIndex + 1} of {questions.length}
                        </span>
                    )}
                </div>

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
                    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white shadow-sm">
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
                            <p className="text-xl font-semibold leading-relaxed text-slate-950">
                                {currentQuestion.question}
                            </p>

                            {currentQuestion.answer ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-medium text-slate-500">Submitted answer</p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                        {currentQuestion.answer.answer}
                                    </p>
                                </div>
                            ) : (
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">Your answer</span>
                                    <textarea
                                        value={answer}
                                        onChange={(event) => setAnswer(event.target.value)}
                                        rows={8}
                                        className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm leading-6 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        placeholder="Write your response here..."
                                        required
                                    />
                                    <span className="mt-2 block text-right text-xs font-medium text-slate-500">
                                        {answer.length} characters
                                    </span>
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
                                    disabled={displayIndex === questions.length - 1}
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
                )}
            </div>
        </AppLayout>
    );
}

export default InterviewSession;
