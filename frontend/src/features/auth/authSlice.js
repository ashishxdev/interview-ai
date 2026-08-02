import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: false,
    isCheckingAuth: !!localStorage.getItem("token"),
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess(state, action) {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.isCheckingAuth = false;
        },

        restoreSession(state, action) {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.isCheckingAuth = false;
        },

        logout(state) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isCheckingAuth = false;
        },

        finishAuthCheck(state) {
            state.isCheckingAuth = false;
        }
    },
});

export const { loginSuccess, restoreSession, logout, finishAuthCheck } = authSlice.actions;
export default authSlice.reducer;
