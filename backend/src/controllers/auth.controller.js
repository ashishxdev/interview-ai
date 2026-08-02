import { registerUser, loginUser } from "../services/auth.service.js";
import prisma from "../config/prisma.js";

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

export const getCurrentUser = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        return res.status(200).json({
            success: true,
            data: user,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}