import { Link } from "react-router-dom";
import { Sparkles, Mic, FileText, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";

function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-sky-600" />
                        <span className="text-xl font-bold text-slate-950">Interview AI</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="inline-flex h-10 items-center px-4 text-sm font-medium text-slate-700 hover:text-slate-950"
                        >
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Get started
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="mx-auto max-w-7xl px-6 py-20 text-center lg:px-8 lg:py-32">
                <div className="mx-auto max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1.5 text-sm font-medium text-sky-700">
                        <Sparkles className="h-4 w-4" />
                        AI-Powered Practice
                    </div>
                    <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                        Ace your next interview with{" "}
                        <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                            AI-powered practice
                        </span>
                    </h1>
                    <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
                        Upload your resume and practice realistic voice interviews. Get instant feedback, detailed reports, and improve your skills with every session.
                    </p>
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        <Link
                            to="/signup"
                            className="inline-flex h-12 items-center gap-2 rounded-lg bg-slate-950 px-8 text-base font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800"
                        >
                            Start practicing free
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex h-12 items-center rounded-lg border border-slate-300 bg-white px-8 text-base font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        icon={<Mic className="h-6 w-6" />}
                        title="Voice interviews"
                        description="Practice speaking your answers naturally. Our AI listens and evaluates your responses just like a real interviewer."
                    />
                    <FeatureCard
                        icon={<FileText className="h-6 w-6" />}
                        title="Resume-based questions"
                        description="Questions tailored to your background. Upload your resume and get personalized technical and behavioral questions."
                    />
                    <FeatureCard
                        icon={<TrendingUp className="h-6 w-6" />}
                        title="Detailed reports"
                        description="See exactly where you excel and where to improve. Get actionable feedback and track your progress over time."
                    />
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <h2 className="text-center text-3xl font-bold text-slate-950">How it works</h2>
                <div className="mt-12 grid gap-8 md:grid-cols-3">
                    <Step
                        number="1"
                        title="Upload your resume"
                        description="Our AI analyzes your skills, experience, and projects to create personalized interview questions."
                    />
                    <Step
                        number="2"
                        title="Answer with your voice"
                        description="Speak naturally while our AI listens. No typing—just like a real interview conversation."
                    />
                    <Step
                        number="3"
                        title="Get instant feedback"
                        description="Receive detailed scores, strengths, weaknesses, and an improvement plan after every interview."
                    />
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 px-8 py-16 text-center shadow-xl">
                    <h2 className="text-3xl font-bold text-white sm:text-4xl">
                        Ready to nail your next interview?
                    </h2>
                    <p className="mt-4 text-lg text-slate-300">
                        Join now and start practicing with AI-powered interviews.
                    </p>
                    <Link
                        to="/signup"
                        className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-8 text-base font-semibold text-slate-950 hover:bg-slate-100"
                    >
                        Create free account
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </section>

            <footer className="border-t border-slate-200 bg-slate-50 py-12">
                <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                    <div className="flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">Interview AI</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                        Practice makes perfect. Start your journey today.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                {icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
    );
}

function Step({ number, title, description }) {
    return (
        <div className="relative text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-2xl font-bold text-white shadow-lg">
                {number}
            </div>
            <h3 className="mt-5 text-xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
    );
}

export default Home;
