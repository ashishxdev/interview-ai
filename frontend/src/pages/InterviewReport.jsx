import { Link, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Download, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";

import AppLayout from "../components/AppLayout";
import { useInterviewReport } from "../features/interview/interviewHooks";
import { downloadReportPdf } from "../utils/reportPdf";

const scoreItems = [
    ["overallScore", "Overall score"],
    ["technicalScore", "Technical"],
    ["communicationScore", "Communication"],
    ["confidenceScore", "Confidence"],
    ["problemSolvingScore", "Problem solving"],
];

function ScoreBar({ label, value }) {
    const score = Math.max(0, Math.min(100, Number(value ?? 0)));

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-600">{label}</span>
                <span className="text-lg font-semibold text-slate-950">{score}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-sky-600" style={{ width: `${score}%` }} />
            </div>
        </div>
    );
}

function ListCard({ title, items }) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            {Array.isArray(items) && items.length > 0 ? (
                <ul className="mt-4 space-y-3">
                    {items.map((item, index) => (
                        <li key={`${title}-${index}`} className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                            {item}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-4 text-sm text-slate-500">No details available.</p>
            )}
        </section>
    );
}

function InterviewReport() {
    const { interviewId } = useParams();
    const reportQuery = useInterviewReport(interviewId);
    const report = reportQuery.data?.report;
    const integrity = reportQuery.data?.integrity;

    return (
        <AppLayout>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Link to="/interviews" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
                        <ArrowLeft className="h-4 w-4" />
                        History
                    </Link>
                    <h1 className="mt-3 text-2xl font-semibold text-slate-950">Interview report</h1>
                </div>
                {report && (
                    <button
                        type="button"
                        onClick={() => downloadReportPdf({ report, integrity })}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
                    >
                        <Download className="h-4 w-4" />
                        Download PDF
                    </button>
                )}
            </div>

            {reportQuery.isLoading && (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="h-24 animate-pulse rounded-lg bg-white ring-1 ring-slate-200" />
                        ))}
                    </div>
                    <div className="h-40 animate-pulse rounded-lg bg-white ring-1 ring-slate-200" />
                </div>
            )}

            {reportQuery.isError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5" />
                        <div>
                            <p className="font-semibold">Report is not ready yet.</p>
                            <p className="mt-1 text-sm">Complete all answers, then retry report generation.</p>
                            <button
                                type="button"
                                onClick={() => reportQuery.refetch()}
                                className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-rose-700 px-3 text-sm font-medium text-white"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {report && (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {scoreItems.map(([key, label]) => (
                            <ScoreBar key={key} label={label} value={report[key]} />
                        ))}
                    </div>

                    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-950">Overall feedback</h2>
                        <p className="mt-3 leading-7 text-slate-700">
                            {report.overallFeedback || "No feedback available."}
                        </p>
                    </section>

                    {integrity && (
                        (() => {
                            const flags = (integrity.tabSwitchCount ?? 0) + (integrity.fullscreenExits ?? 0);
                            const clean = flags === 0;
                            return (
                                <section
                                    className={`rounded-lg border p-5 shadow-sm ${
                                        clean ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {clean ? (
                                            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                        ) : (
                                            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                        )}
                                        <div>
                                            <h2 className={`text-lg font-semibold ${clean ? "text-emerald-900" : "text-amber-900"}`}>
                                                Interview integrity
                                            </h2>
                                            <p className={`mt-1 text-sm ${clean ? "text-emerald-700" : "text-amber-700"}`}>
                                                {clean
                                                    ? "No proctoring flags — the candidate stayed focused throughout."
                                                    : `${flags} proctoring ${flags === 1 ? "flag" : "flags"} recorded during this interview.`}
                                            </p>
                                            {!clean && (
                                                <ul className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-amber-800">
                                                    <li className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-amber-200">
                                                        Tab switches: {integrity.tabSwitchCount ?? 0}
                                                    </li>
                                                    <li className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-amber-200">
                                                        Fullscreen exits: {integrity.fullscreenExits ?? 0}
                                                    </li>
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            );
                        })()
                    )}

                    <div className="grid gap-4 lg:grid-cols-3">
                        <ListCard title="Strengths" items={report.strengths} />
                        <ListCard title="Weaknesses" items={report.weaknesses} />
                        <ListCard title="Improvement plan" items={report.improvementPlan} />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

export default InterviewReport;
