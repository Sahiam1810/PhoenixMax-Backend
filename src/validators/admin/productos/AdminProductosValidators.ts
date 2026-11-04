import { z } from "../../../config/zod.js"
export const adminProductoSchema = z.object({ plataformaId: z.number().int().positive(), tipo: z.enum(["cuenta", "pantalla"]), duracionDias: z.number().int().positive(), precio: z.number().positive() })
