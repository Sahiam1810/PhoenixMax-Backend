import { z } from "../config/zod.js"

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() })
export const estadoSchema = z.string().min(1, "El estado es obligatorio")
export const paginationQuerySchema = z.object({
    page: z.coerce.number().int("La página debe ser un número entero").positive("La página debe ser mayor que cero").default(1),
    limit: z.coerce.number().int("El límite debe ser un número entero").positive("El límite debe ser mayor que cero").max(50, "El límite máximo es 50").default(10)
})
