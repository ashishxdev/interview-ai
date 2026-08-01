import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { loginSuccess } from "./authSlice";
import { loginUser } from "../../api/auth.api";
import { saveToken } from "../../services/token";

export const useLogin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: loginUser,

        onSuccess: (response) => {
            const { user, token } = response.data;
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
