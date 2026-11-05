import { QueryTypes } from "sequelize"
import { sequelize } from "../../config/database.js"
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

interface StockRow {
    plataformaId: number | string
    stock: number | string
}

const STOCK_CUENTAS_SQL = `
    SELECT cuentasElegibles.plataformaId, COUNT(*) AS stock
    FROM (
        SELECT c.id, c.plataformaId
        FROM cuentas c
        INNER JOIN pantallas p ON p.cuentaId = c.id
        WHERE c.plataformaId IN (:plataformaIds)
          AND c.estado = 'disponible'
        GROUP BY c.id, c.plataformaId
        HAVING COUNT(p.id) > 0
           AND SUM(p.estado = 'vendida') = 0
    ) AS cuentasElegibles
    GROUP BY cuentasElegibles.plataformaId
`

const STOCK_PANTALLAS_SQL = `
    SELECT c.plataformaId, COUNT(*) AS stock
    FROM cuentas c
    INNER JOIN pantallas p ON p.cuentaId = c.id
    WHERE c.plataformaId IN (:plataformaIds)
      AND c.estado IN ('disponible', 'parcial')
      AND p.estado = 'disponible'
    GROUP BY c.plataformaId
`

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

    async stockCuentasPorPlataforma(plataformaIds: number[]): Promise<Map<number, number>> {
        return this.stockPorPlataforma(STOCK_CUENTAS_SQL, plataformaIds)
    }

    async stockPantallasPorPlataforma(plataformaIds: number[]): Promise<Map<number, number>> {
        return this.stockPorPlataforma(STOCK_PANTALLAS_SQL, plataformaIds)
    }

    private async stockPorPlataforma(sql: string, plataformaIds: number[]): Promise<Map<number, number>> {
        const stock = new Map<number, number>()

        if (plataformaIds.length === 0) {
            return stock
        }

        const rows = await sequelize.query<StockRow>(sql, {
            type: QueryTypes.SELECT,
            replacements: { plataformaIds }
        })

        for (const row of rows) {
            stock.set(Number(row.plataformaId), Number(row.stock))
        }

        return stock
    }
}
