import { z } from "../../config/zod.js"
export const carritoItemSchema = z.object({ productoId: z.number().int().positive(), cantidad: z.number().int().positive() })
