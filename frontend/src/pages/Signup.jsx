import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";

import { signupSchema } from "../utils/authSchema";
import { useSignup } from "../features/auth/authHooks";
import Spinner from "../components/Spinner";

function Signup() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(signupSchema)
    })

    const signupMutation = useSignup();
    const onSubmit = (formData) => {
        const data = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
        };

        signupMutation.mutate(data);
    }

    return (
        <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-50 px-5 py-10">
            <section className="w-full max-w-md rounded-xl border border-slate-200/60 bg-white p-8 shadow-xl shadow-slate-900/5">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-sky-100 px-3 py-1.5 text-sm font-medium text-sky-700">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
                        </span>
                        Interview AI
                    </div>
                    <h1 className="mt-4 text-3xl font-bold text-slate-950">Create account</h1>
                    <p className="mt-2 text-sm text-slate-600">Start practicing with AI-powered interviews</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Name</span>
                        <input
                            type="text"
                            placeholder="Your name"
                            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            {...register("name")}
                        />
                        {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name.message}</p>}
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Email</span>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            {...register("email")}
                        />
                        {errors.email && <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p>}
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Password</span>
                        <input
                            type="password"
                            placeholder="Password"
                            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            {...register("password")}
                        />
                        {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-slate-700">Confirm password</span>
                        <input
                            type="password"
                            placeholder="Confirm password"
                            className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            {...register("confirmPassword")}
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword.message}</p>
                        )}
                    </label>

                    <button
                        type="submit"
                        disabled={signupMutation.isPending}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {signupMutation.isPending ? <Spinner /> : <UserPlus className="h-4 w-4" />}
                        {signupMutation.isPending ? "Creating account..." : "Sign up"}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-slate-950 hover:underline">
                        Login
                    </Link>
                </p>
            </section>
        </main>
    )
}

export default Signup;
