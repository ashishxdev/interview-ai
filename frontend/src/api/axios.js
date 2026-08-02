import axios from "axios";
import { getToken } from "../services/token";
import { removeToken } from "../services/token";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config;
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            removeToken();

            if (!window.location.pathname.includes("/login")) {
                window.location.assign("/login");
            }
        }

        return Promise.reject(error);
    }
);

export default api;
