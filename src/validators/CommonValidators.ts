import { z } from "../config/zod.js"

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() })
export const estadoSchema = z.string().min(1, "El estado es obligatorio")
export const paginationQuerySchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) })
