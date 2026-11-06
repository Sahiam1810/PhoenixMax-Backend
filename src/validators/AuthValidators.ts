import { z } from "../config/zod.js"

export const registerSchema = z.object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio"),
    email: z.email("Correo inválido").trim().toLowerCase(),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    telefono: z.string().trim().optional()
})

export const loginSchema = z.object({
    email: z.email("Correo inválido").trim().toLowerCase(),
    password: z.string().min(1, "La contraseña es obligatoria")
})

export const actualizarPerfilSchema = z.object({
    nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").optional(),
    telefono: z.string().trim().nullable().optional()
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ActualizarPerfilInput = z.infer<typeof actualizarPerfilSchema>
