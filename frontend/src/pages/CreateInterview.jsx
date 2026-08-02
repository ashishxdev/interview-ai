import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, FileText, RefreshCw, Sparkles } from "lucide-react";

import AppLayout from "../components/AppLayout";
import Spinner from "../components/Spinner";
import { useCreateInterview } from "../features/interview/interviewHooks";
import { useResumes } from "../features/resume/resumeHooks";

const difficulties = ["EASY", "MEDIUM", "HARD"];

function CreateInterview() {
    const [searchParams] = useSearchParams();
    const resumesQuery = useResumes();
    const createMutation = useCreateInterview();
    const resumes = useMemo(() => resumesQuery.data?.resumes ?? [], [resumesQuery.data?.resumes]);
    const defaultResumeId = searchParams.get("resumeId") || "";
    const [form, setForm] = useState({
        resumeId: defaultResumeId,
        difficulty: "MEDIUM",
        title: "",
    });

    const handleChange = (event) => {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        createMutation.mutate({
            resumeId: Number(form.resumeId),
            difficulty: form.difficulty,
            title: form.title.trim() || "Practice Interview",
        });
    };

    const canSubmit = Boolean(form.resumeId) && !createMutation.isPending;

    return (
        <AppLayout>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
                <section>
                    <h1 className="text-2xl font-semibold text-slate-950">Create interview</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Choose a resume and difficulty. Question generation can take a moment.
                    </p>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5 p-5">
                        {resumesQuery.isLoading && (
                            <div className="space-y-3">
                                <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                                <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                                <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                            </div>
                        )}

                        {resumesQuery.isError && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-5 w-5" />
                                    <div>
                                        <p className="font-medium">Could not load resumes.</p>
                                        <button
                                            type="button"
                                            onClick={() => resumesQuery.refetch()}
                                            className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-rose-700 px-3 text-sm font-medium text-white"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Retry
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!resumesQuery.isLoading && !resumesQuery.isError && resumes.length === 0 && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                                <FileText className="mx-auto h-8 w-8 text-slate-400" />
                                <p className="mt-3 font-medium text-slate-950">Upload a resume before creating an interview.</p>
                            </div>
                        )}

                        {resumes.length > 0 && (
                            <>
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">Resume</span>
                                    <select
                                        name="resumeId"
                                        value={form.resumeId}
                                        onChange={handleChange}
                                        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        required
                                    >
                                        <option value="">Select a resume</option>
                                        {resumes.map((resume) => (
                                            <option key={resume.id} value={resume.id}>
                                                {resume.title}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">Difficulty</span>
                                    <select
                                        name="difficulty"
                                        value={form.difficulty}
                                        onChange={handleChange}
                                        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    >
                                        {difficulties.map((difficulty) => (
                                            <option key={difficulty} value={difficulty}>
                                                {difficulty}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">Interview title</span>
                                    <input
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        placeholder="Frontend practice round"
                                        className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {createMutation.isPending ? <Spinner /> : <Sparkles className="h-4 w-4" />}
                                    {createMutation.isPending ? "Generating questions..." : "Start interview"}
                                </button>
                            </>
                        )}
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}

export default CreateInterview;
