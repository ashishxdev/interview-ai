import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { finishAuthCheck, loginSuccess, logout, restoreSession } from "./authSlice";
import { getCurrentUser, loginUser, registerUser } from "../../api/auth.api";
import { saveToken } from "../../services/token";
import { getToken, removeToken } from "../../services/token";

export const useLogin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: loginUser,

        onSuccess: (response) => {
            const { user, token } = response.data;
            queryClient.clear();
            saveToken(token);

            dispatch(
                loginSuccess({
                    user,
                    token,
                })
            )

            toast.success(response.message);
            navigate("/dashboard");
        },

        onError: (error) => {
            toast.error(error.response?.data?.error || "Login failed.")
        }
    })
}

export const useSignup = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: registerUser,

        onSuccess: (response) => {
            toast.success(response.message);
            navigate("/login");
        },

        onError: (error) => {
            toast.error(
                error.response?.data?.message || "Registration Failed."
            )
        }
    })
}

export const useRestoreSession = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useCallback(async () => {
        const token = getToken();

        if (!token) {
            queryClient.clear();
            dispatch(logout());
            navigate("/login", { replace: true });
            return;
        }

        try {
            const response = await getCurrentUser();
            dispatch(
                restoreSession({
                    user: response.data,
                    token,
                })
            );
        } catch {
            removeToken();
            queryClient.clear();
            dispatch(logout());
            navigate("/login", { replace: true });
        } finally {
            dispatch(finishAuthCheck());
        }
    }, [dispatch, navigate, queryClient]);
};
