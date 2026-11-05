import { z } from "../config/zod.js"

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() })
export const estadoSchema = z.string().min(1, "El estado es obligatorio")

export const paginationQuerySchema = z.object({
    page: z.coerce
        .number({ error: "La página debe ser un número entero positivo" })
        .int("La página debe ser un número entero positivo")
        .positive("La página debe ser un número entero positivo")
        .default(1),
    limit: z.coerce
        .number({ error: "El límite debe ser un número entero positivo" })
        .int("El límite debe ser un número entero positivo")
        .positive("El límite debe ser un número entero positivo")
        .max(50, "El límite máximo es 50")
        .default(10)
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type IdParam = z.infer<typeof idParamSchema>
