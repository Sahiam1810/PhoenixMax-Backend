import { z } from "../../config/zod.js"

const productoIdSchema = z.coerce
    .number({ error: "El producto debe ser un número entero positivo" })
    .int("El producto debe ser un número entero positivo")
    .positive("El producto debe ser un número entero positivo")

const cantidadSchema = z.coerce
    .number({ error: "La cantidad debe ser un número entero positivo" })
    .int("La cantidad debe ser un número entero positivo")
    .positive("La cantidad debe ser un número entero positivo")
    .max(100, "La cantidad máxima es 100")

export const addCarritoItemSchema = z.object({
    productoId: productoIdSchema,
    cantidad: cantidadSchema
})

export const updateCarritoItemSchema = z.object({
    cantidad: cantidadSchema
})

export const itemIdParamSchema = z.object({
    itemId: z.coerce
        .number({ error: "El ítem debe ser un número entero positivo" })
        .int("El ítem debe ser un número entero positivo")
        .positive("El ítem debe ser un número entero positivo")
})

export type AddCarritoItemInput = z.infer<typeof addCarritoItemSchema>
export type UpdateCarritoItemInput = z.infer<typeof updateCarritoItemSchema>
export type CarritoItemIdParams = z.infer<typeof itemIdParamSchema>
