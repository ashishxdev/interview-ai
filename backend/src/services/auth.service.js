import prisma from "../config/prisma.js"
import bcrypt from "bcryptjs"

export const registerUser = async (data) => {
    const { name, email, password } = data;
    if (!name || !email || !password) {
        const error = new Error("Missing required fields!")
        error.statusCode = 400;
        throw error;
    }
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })
    if (existingUser) {
        const error = new Error("Email already registered")
        error.statusCode = 409;
        throw error;
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
        data: {
            name, email,
            password: hashedPassword
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
        }
    })

    return newUser;
}