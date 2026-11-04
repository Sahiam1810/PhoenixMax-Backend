import { z } from "../../config/zod.js"
export const compraSchema = z.object({ metodoPago: z.string().min(1) })
