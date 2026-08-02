import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, FileText, RefreshCw, Search, Trash2 } from "lucide-react";

import AppLayout from "../components/AppLayout";
import Spinner from "../components/Spinner";
import { useDeleteInterview, useInterviewHistory } from "../features/interview/interviewHooks";

const statuses = ["ALL", "PENDING", "STARTED", "COMPLETED", "FAILED", "CANCELLED"];
const difficulties = ["ALL", "EASY", "MEDIUM", "HARD"];

const formatDate = (date) => {
    if (!date) return "Not available";

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
};

const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
};

function InterviewHistory() {
    const historyQuery = useInterviewHistory();
    const deleteMutation = useDeleteInterview();
    const [filters, setFilters] = useState({
        search: "",
        status: "ALL",
        difficulty: "ALL",
    });

    const interviews = useMemo(
        () => historyQuery.data?.interviews ?? [],
        [historyQuery.data?.interviews]
    );
    const filteredInterviews = useMemo(() => {
        return interviews.filter((interview) => {
            const matchesSearch = (interview.title || "Untitled interview")
                .toLowerCase()
                .includes(filters.search.toLowerCase());
            const matchesStatus = filters.status === "ALL" || interview.status === filters.status;
            const matchesDifficulty = filters.difficulty === "ALL" || interview.difficulty === filters.difficulty;

            return matchesSearch && matchesStatus && matchesDifficulty;
        });
    }, [filters, interviews]);

    const handleFilterChange = (event) => {
        setFilters((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleDelete = (interview) => {
        const confirmed = window.confirm(`Delete "${interview.title || "Untitled interview"}"?`);

        if (confirmed) {
            deleteMutation.mutate(interview.id);
        }
    };

    return (
        <AppLayout>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-950">Interview history</h1>
                    <p className="mt-2 text-sm text-slate-500">Review past sessions and continue from active interviews.</p>
                </div>
                <Link
                    to="/interviews/new"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                >
                    Create interview
                </Link>
            </div>

            <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
                    <label className="relative block">
                        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search by title"
                            className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />
                    </label>
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    >
                        {statuses.map((status) => (
                            <option key={status} value={status}>
                                {status === "ALL" ? "All statuses" : formatStatus(status)}
                            </option>
                        ))}
                    </select>
                    <select
                        name="difficulty"
                        value={filters.difficulty}
                        onChange={handleFilterChange}
                        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    >
                        {difficulties.map((difficulty) => (
                            <option key={difficulty} value={difficulty}>
                                {difficulty === "ALL" ? "All difficulties" : difficulty}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {historyQuery.isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="h-28 animate-pulse rounded-lg bg-white ring-1 ring-slate-200" />
                    ))}
                </div>
            )}

            {historyQuery.isError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5" />
                        <div>
                            <p className="font-semibold">Could not load interviews.</p>
                            <button
                                type="button"
                                onClick={() => historyQuery.refetch()}
                                className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-rose-700 px-3 text-sm font-medium text-white"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!historyQuery.isLoading && !historyQuery.isError && filteredInterviews.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <FileText className="mx-auto h-10 w-10 text-slate-400" />
                    <h2 className="mt-4 text-lg font-semibold text-slate-950">No interviews found.</h2>
                </div>
            )}

            {filteredInterviews.length > 0 && (
                <div className="space-y-3">
                    {filteredInterviews.map((interview) => (
                        <article key={interview.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                    <h2 className="truncate font-semibold text-slate-950">
                                        {interview.title || "Untitled interview"}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {interview.difficulty} · {formatStatus(interview.status)} · {formatDate(interview.createdAt)}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                                        {interview.overallScore == null ? "No score" : `${interview.overallScore}%`}
                                    </span>
                                    {interview.status === "COMPLETED" ? (
                                        <Link
                                            to={`/interviews/${interview.id}/report`}
                                            className="inline-flex h-10 items-center rounded-lg bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
                                        >
                                            View report
                                        </Link>
                                    ) : (
                                        <Link
                                            to={`/interviews/${interview.id}`}
                                            className="inline-flex h-10 items-center rounded-lg bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
                                        >
                                            Continue
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(interview)}
                                        disabled={deleteMutation.isPending}
                                        className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        aria-label={`Delete ${interview.title || "interview"}`}
                                    >
                                        {deleteMutation.isPending ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}

export default InterviewHistory;
