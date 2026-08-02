import { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    Clock3,
    FileText,
    RefreshCw,
    Trash2,
    UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "../components/AppLayout";
import { useDashboardStats } from "../features/dashboard/dashboardHooks";
import { useDeleteResume, useResumes, useUploadResume } from "../features/resume/resumeHooks";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const formatDate = (date) => {
    if (!date) return "Not available";

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
};

const formatStatus = (status) => {
    if (!status) return "Ready";
    return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
};

function StatCard({ icon: Icon, label, value, tone }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
                </div>
                <div className={`grid h-11 w-11 place-items-center rounded-lg ${tone}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
                <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    <div className="mt-4 h-8 w-16 animate-pulse rounded bg-slate-200" />
                </div>
            ))}
        </div>
    );
}

function ResumeManager() {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const resumesQuery = useResumes();
    const uploadMutation = useUploadResume();
    const deleteMutation = useDeleteResume();

    const resumes = useMemo(
        () => resumesQuery.data?.resumes ?? [],
        [resumesQuery.data?.resumes]
    );

    const selectedResume = useMemo(
        () => resumes.find((resume) => resume.id === selectedResumeId),
        [resumes, selectedResumeId]
    );

    const validateFile = (file) => {
        if (!file) return false;

        if (file.type !== "application/pdf") {
            toast.error("Please upload a PDF file.");
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error("PDF must be 5 MB or smaller.");
            return false;
        }

        return true;
    };

    const uploadFile = (file) => {
        if (!validateFile(file)) return;

        setUploadProgress(0);
        uploadMutation.mutate({
            file,
            onUploadProgress: (event) => {
                if (!event.total) return;
                setUploadProgress(Math.round((event.loaded * 100) / event.total));
            },
        }, {
            onSettled: () => {
                setUploadProgress(0);
                if (inputRef.current) {
                    inputRef.current.value = "";
                }
            },
        });
    };

    const handleDrop = (event) => {
        event.preventDefault();
        uploadFile(event.dataTransfer.files?.[0]);
    };

    const handleDelete = (resumeId) => {
        deleteMutation.mutate(resumeId, {
            onSuccess: () => {
                if (selectedResumeId === resumeId) {
                    setSelectedResumeId(null);
                }
            },
        });
    };

    return (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-950">Resumes</h2>
                        {selectedResume && (
                            <p className="text-sm text-slate-500">Selected: {selectedResume.title}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => resumesQuery.refetch()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-sky-400 hover:bg-sky-50"
                >
                    <UploadCloud className="h-10 w-10 text-sky-600" />
                    <span className="mt-4 text-sm font-semibold text-slate-950">Upload PDF</span>
                    <span className="mt-1 text-sm text-slate-500">Drag or choose a file up to 5 MB</span>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(event) => uploadFile(event.target.files?.[0])}
                    />
                    {uploadMutation.isPending && (
                        <div className="mt-5 w-full max-w-xs">
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-sky-600 transition-all"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="mt-2 text-xs font-medium text-slate-500">
                                {uploadProgress >= 100 ? "Processing resume..." : `${uploadProgress}%`}
                            </p>
                        </div>
                    )}
                </button>

                <div className="min-h-52">
                    {resumesQuery.isLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100" />
                            ))}
                        </div>
                    )}

                    {resumesQuery.isError && (
                        <div className="flex min-h-52 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-5 text-center text-rose-700">
                            <div>
                                <AlertCircle className="mx-auto h-7 w-7" />
                                <p className="mt-2 font-medium">Could not load resumes.</p>
                            </div>
                        </div>
                    )}

                    {!resumesQuery.isLoading && !resumesQuery.isError && resumes.length === 0 && (
                        <div className="flex min-h-52 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
                            <div>
                                <FileText className="mx-auto h-8 w-8 text-slate-400" />
                                <p className="mt-3 font-medium text-slate-950">No resumes uploaded yet.</p>
                            </div>
                        </div>
                    )}

                    {!resumesQuery.isLoading && resumes.length > 0 && (
                        <div className="space-y-3">
                            {resumes.map((resume) => {
                                const isSelected = selectedResumeId === resume.id;

                                return (
                                    <div
                                        key={resume.id}
                                        className={`rounded-lg border p-4 transition ${isSelected ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white"}`}
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedResumeId(resume.id)}
                                                className="min-w-0 text-left"
                                            >
                                                <p className="truncate font-semibold text-slate-950">{resume.title}</p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Uploaded {formatDate(resume.createdAt)} · {formatStatus(resume.parsedData?.parsingStatus)}
                                                </p>
                                            </button>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedResumeId(resume.id);
                                                        navigate(`/interviews/new?resumeId=${resume.id}`);
                                                    }}
                                                    className="h-9 rounded-lg bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
                                                >
                                                    Start
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Delete ${resume.title}`}
                                                    onClick={() => handleDelete(resume.id)}
                                                    disabled={deleteMutation.isPending}
                                                    className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function Dashboard() {
    const { user } = useSelector((state) => state.auth);
    const dashboardQuery = useDashboardStats();
    const stats = dashboardQuery.data?.stats;
    const hasInterviews = Number(stats?.totalInterviews ?? 0) > 0;

    return (
        <AppLayout>
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Welcome back</p>
                        <h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">
                            {user?.name || "Dashboard"}
                        </h1>
                    </div>
                    <Link
                        to="/interviews/new"
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        Create interview
                    </Link>
                </header>

                <div className="mt-8 space-y-6">
                    {dashboardQuery.isLoading && <DashboardSkeleton />}

                    {dashboardQuery.isError && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-5 w-5" />
                                <div>
                                    <p className="font-semibold">Dashboard failed to load.</p>
                                    <button
                                        type="button"
                                        onClick={() => dashboardQuery.refetch()}
                                        className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-rose-700 px-3 text-sm font-medium text-white hover:bg-rose-800"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Retry
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {!dashboardQuery.isLoading && !dashboardQuery.isError && (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <StatCard
                                    icon={BarChart3}
                                    label="Total interviews"
                                    value={stats?.totalInterviews ?? 0}
                                    tone="bg-sky-100 text-sky-700"
                                />
                                <StatCard
                                    icon={CheckCircle2}
                                    label="Completed"
                                    value={stats?.completedInterviews ?? 0}
                                    tone="bg-emerald-100 text-emerald-700"
                                />
                                <StatCard
                                    icon={Clock3}
                                    label="Pending"
                                    value={stats?.pendingInterviews ?? 0}
                                    tone="bg-amber-100 text-amber-700"
                                />
                                <StatCard
                                    icon={BarChart3}
                                    label="Average score"
                                    value={`${stats?.averageScore ?? 0}%`}
                                    tone="bg-violet-100 text-violet-700"
                                />
                            </div>

                            {!hasInterviews ? (
                                <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
                                    <Clock3 className="mx-auto h-10 w-10 text-slate-400" />
                                    <h2 className="mt-4 text-lg font-semibold text-slate-950">No interviews yet.</h2>
                                </section>
                            ) : (
                                <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                    <h2 className="text-lg font-semibold text-slate-950">Latest interview</h2>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-4">
                                        <div className="sm:col-span-2">
                                            <p className="text-sm text-slate-500">Title</p>
                                            <p className="mt-1 font-semibold text-slate-950">
                                                {stats?.latestInterview?.title || "Untitled interview"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Status</p>
                                            <p className="mt-1 font-semibold text-slate-950">
                                                {formatStatus(stats?.latestInterview?.status)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Created</p>
                                            <p className="mt-1 font-semibold text-slate-950">
                                                {formatDate(stats?.latestInterview?.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    <ResumeManager />
                </div>
        </AppLayout>
    );
}

export default Dashboard;
