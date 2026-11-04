import { z } from "../../config/zod.js"
export const productosQuerySchema = z.object({ plataforma: z.string().optional(), tipo: z.enum(["cuenta", "pantalla"]).optional() })
