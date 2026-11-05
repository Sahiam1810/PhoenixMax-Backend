import { z } from "../../config/zod.js"
import { paginationQuerySchema } from "../CommonValidators.js"

const bodyOpcional = (valor: unknown): unknown => valor ?? {}

export const payCompraSchema = z.preprocess(bodyOpcional, z.object({
    metodoPago: z
        .enum(["simulado"], { error: "El método de pago debe ser simulado" })
        .default("simulado")
}, { error: "El cuerpo de la petición debe ser un objeto" }))

export const listComprasQuerySchema = paginationQuerySchema

export type PayCompraInput = z.infer<typeof payCompraSchema>
export type ListComprasQuery = z.infer<typeof listComprasQuerySchema>
