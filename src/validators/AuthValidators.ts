import { z } from "../config/zod.js"

export const registerSchema = z.object({ nombre: z.string().min(1), email: z.email(), password: z.string().min(8), telefono: z.string().optional() })
export const loginSchema = z.object({ email: z.email(), password: z.string().min(1) })
