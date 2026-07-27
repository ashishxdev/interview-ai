import { registerUser, loginUser } from "../services/auth.service.js";

export async function register(req, res) {
    try {
        const userInfo = req.body;
        const user = await registerUser(userInfo);
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ error: err.message })
    }
}

export async function login(req, res) {
    try {
        const user = await loginUser(req.body);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: user
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({ error: err.message })
    }
}

export const getProfile = (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Profile fetched",
        user: req.user,
    })
}