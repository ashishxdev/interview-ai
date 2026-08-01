import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema } from "../utils/authSchema";
import { useLogin } from "../features/auth/authHooks";

function Login() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const loginMutation = useLogin();

    const onSubmit = (data) => {
        loginMutation.mutate(data);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <input
                type="email"
                placeholder="email"
                {...register("email")} />
            {errors.email && (
                <p className="text-red-500 text-sm">
                    {errors.email.message}
                </p>
            )}

            <input
                type="password"
                placeholder="Password"
                {...register("password")} />
            {errors.password && (
                <p className="text-red-500 text-sm">
                    {errors.password.message}
                </p>
            )}

            <button disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Logging in..." : "Login"}
            </button>
        </form >
    )
}

export default Login;