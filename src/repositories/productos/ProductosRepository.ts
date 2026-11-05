import type { TipoProducto } from "../../interfaces/Catalogo.js"
import { Plataforma } from "../../models/Plataforma.js"
import { Producto } from "../../models/Producto.js"

interface FindProductosInput {
    plataforma?: number
    tipo?: TipoProducto
    limit: number
    offset: number
}

type ProductoWhere = {
    activo: boolean
    plataformaId?: number
    tipo?: TipoProducto
}

const plataformaActivaInclude = {
    model: Plataforma,
    required: true,
    where: { activo: true },
    attributes: ["id", "nombre", "logoUrl"]
}

export class ProductosRepository {
    async findAndCountActivos(input: FindProductosInput): Promise<{ rows: Producto[], count: number }> {
        const where: ProductoWhere = { activo: true }

        if (input.plataforma !== undefined) {
            where.plataformaId = input.plataforma
        }

        if (input.tipo !== undefined) {
            where.tipo = input.tipo
        }

        return Producto.findAndCountAll({
            where,
            include: [plataformaActivaInclude],
            order: [
                ["plataformaId", "ASC"],
                ["tipo", "ASC"],
                ["duracionDias", "ASC"],
                ["id", "ASC"]
            ],
            limit: input.limit,
            offset: input.offset,
            distinct: true
        })
    }

    async findActivoById(id: number): Promise<Producto | null> {
        return Producto.findOne({
            where: { id, activo: true },
            include: [plataformaActivaInclude]
        })
    }

}
