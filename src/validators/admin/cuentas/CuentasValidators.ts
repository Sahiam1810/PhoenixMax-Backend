import { z } from "../../../config/zod.js"
export const cuentaSchema = z.object({ plataformaId: z.number().int().positive(), emailAcceso: z.email(), passwordAcceso: z.string().min(1) })
