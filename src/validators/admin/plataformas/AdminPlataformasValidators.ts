import { z } from "../../../config/zod.js"
export const adminPlataformaSchema = z.object({ nombre: z.string().min(1), maxPantallas: z.number().int().positive() })
