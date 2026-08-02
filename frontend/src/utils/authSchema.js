import { z } from "zod";

export const loginSchema = z.object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(8, "Password must be atleast 8 characters")
})

export const signupSchema = z.object({
    name: z.string().min(3, "Name is required"),
    email: z.email("Please enter a valid email"),
    password: z.string().min(8, "Password must be atleast 8 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.confirmPassword === data.password, {
    message: "Password do not match",
    path: ["confirmPassword"],
})