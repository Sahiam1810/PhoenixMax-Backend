import { z } from "../../../config/zod.js"

const plataformaIdSchema = z.number().int().positive("La plataforma debe ser un entero positivo")
const tipoSchema = z.enum(["cuenta", "pantalla"], { error: "El tipo no es vÃ¡lido" })
const duracionDiasSchema = z.number().int().positive("La duraciÃ³n debe ser un entero positivo")
const precioSchema = z.number().positive("El precio debe ser mayor a cero")

export const adminProductoSchema = z.object({ plataformaId: plataformaIdSchema, tipo: tipoSchema, duracionDias: duracionDiasSchema, precio: precioSchema })
export const updateAdminProductoSchema = adminProductoSchema.partial().refine((input) => Object.keys(input).length > 0, "Debe enviar al menos un campo")
export const updateAdminProductoEstadoSchema = z.object({ activo: z.boolean() })

export type CreateAdminProductoInput = z.infer<typeof adminProductoSchema>
export type UpdateAdminProductoInput = z.infer<typeof updateAdminProductoSchema>
export type UpdateAdminProductoEstadoInput = z.infer<typeof updateAdminProductoEstadoSchema>
