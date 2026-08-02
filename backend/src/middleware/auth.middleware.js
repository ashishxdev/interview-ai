import jwt from "jsonwebtoken"
import prisma from "../config/prisma.js";

export const authenticate = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Authorization header missing or invalid"
            })
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        )

        const userId = Number(decoded.id);

        if (!Number.isInteger(userId)) {
            return res.status(401).json({
                error: "Invalid token",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                error: "Invalid token",
            });
        }

        req.user = user;
        next();

    } catch (err) {
        return res.status(401).json({
            error: "Invalid token",
        })
    }
}
