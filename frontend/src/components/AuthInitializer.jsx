import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";

import { finishAuthCheck } from "../features/auth/authSlice";
import { useRestoreSession } from "../features/auth/authHooks";
import { getToken } from "../services/token";

const publicRoutes = new Set(["/login", "/signup"]);

function AuthInitializer() {
    const location = useLocation();
    const dispatch = useDispatch();
    const restoreSession = useRestoreSession();

    useEffect(() => {
        const token = getToken();

        if (!token) {
            dispatch(finishAuthCheck());
            return;
        }

        if (publicRoutes.has(location.pathname)) {
            dispatch(finishAuthCheck());
            return;
        }

        restoreSession();
    }, [dispatch, location.pathname, restoreSession]);

    return null;
}

export default AuthInitializer;
