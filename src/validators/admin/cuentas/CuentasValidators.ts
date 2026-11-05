import { z } from "../../../config/zod.js"
import { paginationQuerySchema } from "../../CommonValidators.js"

const plataformaIdSchema = z.coerce
    .number({ error: "La plataforma debe ser un número entero positivo" })
    .int("La plataforma debe ser un número entero positivo")
    .positive("La plataforma debe ser un número entero positivo")

export const createCuentaSchema = z.object({
    plataformaId: plataformaIdSchema,
    emailAcceso: z
        .string({ error: "El correo de acceso es obligatorio" })
        .trim()
        .toLowerCase()
        .email("El correo de acceso no es válido")
        .max(160, "El correo de acceso no puede superar 160 caracteres"),
    passwordAcceso: z
        .string({ error: "La contraseña de acceso es obligatoria" })
        .min(8, "La contraseña de acceso debe tener al menos 8 caracteres")
        .max(255, "La contraseña de acceso no puede superar 255 caracteres")
})

export const listCuentasQuerySchema = paginationQuerySchema.extend({
    limit: z.coerce
        .number({ error: "El límite debe ser un número entero positivo" })
        .int("El límite debe ser un número entero positivo")
        .positive("El límite debe ser un número entero positivo")
        .max(50, "El límite máximo es 50")
        .default(10),
    plataforma: plataformaIdSchema.optional(),
    estado: z
        .enum(["disponible", "parcial", "vendida", "inactiva"], { error: "El estado no es válido" })
        .optional()
})

export type CreateCuentaInput = z.infer<typeof createCuentaSchema>
export type ListCuentasQuery = z.infer<typeof listCuentasQuerySchema>
