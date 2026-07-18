import { registerUser } from "../services/auth.service.js";

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

export default register;