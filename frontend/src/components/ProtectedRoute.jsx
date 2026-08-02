import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function ProtectedRoute({ children }) {
    const { isAuthenticated, isCheckingAuth } = useSelector(
        state => state.auth
    )

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-slate-50 px-6 py-10">
                <div className="mx-auto max-w-6xl space-y-5">
                    <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="h-28 animate-pulse rounded-lg bg-white shadow-sm ring-1 ring-slate-200" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={"/login"} replace />
    }

    return children;
}

export default ProtectedRoute;
