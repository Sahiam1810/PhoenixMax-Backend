import { z } from "../../config/zod.js"
import { paginationQuerySchema } from "../CommonValidators.js"

export const listProductosQuerySchema = paginationQuerySchema.extend({
    plataforma: z.coerce.number().int("La plataforma debe ser un número entero positivo").positive("La plataforma debe ser un número entero positivo").optional(),
    tipo: z.enum(["cuenta", "pantalla"], "El tipo debe ser cuenta o pantalla").optional()
})

export type ListProductosQuery = z.infer<typeof listProductosQuerySchema>
