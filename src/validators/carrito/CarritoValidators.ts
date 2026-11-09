import { z } from "../../config/zod.js"

const productoIdSchema = z.coerce
    .number({ error: "El producto debe ser un número entero positivo" })
    .int("El producto debe ser un número entero positivo")
    .positive("El producto debe ser un número entero positivo")

const servicioIdSchema = z.coerce.number().int().positive()

const cantidadSchema = z.coerce
    .number({ error: "La cantidad debe ser un número entero positivo" })
    .int("La cantidad debe ser un número entero positivo")
    .positive("La cantidad debe ser un número entero positivo")
    .max(100, "La cantidad máxima es 100")

export const addCarritoItemSchema = z.preprocess((valor: unknown) => {
    if (valor && typeof valor === "object") {
        const obj = valor as Record<string, unknown>
        if ("servicio_id" in obj && !("servicioId" in obj)) {
            return { ...obj, servicioId: obj.servicio_id }
        }
        if ("producto_id" in obj && !("productoId" in obj)) {
            return { ...obj, productoId: obj.producto_id }
        }
    }
    return valor
}, z.object({
    productoId: productoIdSchema,
    cantidad: cantidadSchema,
    servicioId: servicioIdSchema.optional()
}))

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
