import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, FilePlus2, History, LogOut } from "lucide-react";

import { logout } from "../features/auth/authSlice";
import { removeToken } from "../services/token";

const linkClass = ({ isActive }) =>
    `inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${
        isActive
            ? "bg-slate-950 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

function AppLayout({ children }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        removeToken();
        queryClient.clear();
        dispatch(logout());
        navigate("/login", { replace: true });
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <Link to="/dashboard" className="text-lg font-semibold text-slate-950">
                            Interview AI
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 lg:hidden"
                            aria-label="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>

                    <nav className="flex flex-wrap items-center gap-2">
                        <NavLink to="/dashboard" className={linkClass}>
                            <BarChart3 className="h-4 w-4" />
                            Dashboard
                        </NavLink>
                        <NavLink to="/interviews/new" className={linkClass}>
                            <FilePlus2 className="h-4 w-4" />
                            Create
                        </NavLink>
                        <NavLink to="/interviews" className={linkClass}>
                            <History className="h-4 w-4" />
                            History
                        </NavLink>
                    </nav>

                    <div className="hidden items-center gap-3 lg:flex">
                        <span className="max-w-48 truncate text-sm font-medium text-slate-600">
                            {user?.name || user?.email}
                        </span>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
    );
}

export default AppLayout;
