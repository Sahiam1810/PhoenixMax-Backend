import { z } from "../../../config/zod.js"

const nombreSchema = z.string().trim().min(1, "El nombre es obligatorio").max(120, "El nombre no puede superar 120 caracteres")
const maxPantallasSchema = z.number().int().positive("Las pantallas deben ser un entero positivo")

export const adminPlataformaSchema = z.object({
    nombre: nombreSchema,
    descripcion: z.string().trim().max(65535).nullable().optional(),
    logoUrl: z.string().trim().url("El logo debe ser una URL vÃ¡lida").nullable().optional(),
    maxPantallas: maxPantallasSchema
})

export const updateAdminPlataformaSchema = adminPlataformaSchema.partial().refine((input) => Object.keys(input).length > 0, "Debe enviar al menos un campo")
export const updateAdminPlataformaEstadoSchema = z.object({ activo: z.boolean() })

export type CreateAdminPlataformaInput = z.infer<typeof adminPlataformaSchema>
export type UpdateAdminPlataformaInput = z.infer<typeof updateAdminPlataformaSchema>
export type UpdateAdminPlataformaEstadoInput = z.infer<typeof updateAdminPlataformaEstadoSchema>
