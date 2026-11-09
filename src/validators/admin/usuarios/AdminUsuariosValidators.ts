import { z } from "../../../config/zod.js"

export const listAdminUsuariosQuerySchema = z.object({
    rol: z.enum(["cliente", "admin"]).optional(),
    activo: z.enum(["true", "false"]).transform((valor) => valor === "true").optional(),
    q: z.string().trim().max(160).optional()
})

export const createAdminUsuarioSchema = z.object({
    nombre: z.string().trim().min(3).max(120),
    email: z.string().trim().toLowerCase().email().max(160),
    telefono: z.string().trim().max(30).optional(),
    password: z.string().min(8).max(255),
    rol: z.enum(["cliente", "admin"])
})

export const updateAdminUsuarioEstadoSchema = z.object({ activo: z.boolean() })

export type ListAdminUsuariosQuery = z.infer<typeof listAdminUsuariosQuerySchema>
export type CreateAdminUsuarioInput = z.infer<typeof createAdminUsuarioSchema>
export type UpdateAdminUsuarioEstadoInput = z.infer<typeof updateAdminUsuarioEstadoSchema>
