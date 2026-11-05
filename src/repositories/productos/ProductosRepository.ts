import { QueryTypes } from "sequelize"
import { sequelize } from "../../config/database.js"
import { Plataforma } from "../../models/Plataforma.js"
import { Producto } from "../../models/Producto.js"

interface FindActivosInput {
    plataforma?: number
    tipo?: "cuenta" | "pantalla"
    limit: number
    offset: number
}

interface StockRow {
    plataformaId: number | string
    stock: number | string
}

export class ProductosRepository {
    async findAndCountActivos(input: FindActivosInput): Promise<{ count: number, rows: Producto[] }> {
        const where: { activo: boolean, plataformaId?: number, tipo?: "cuenta" | "pantalla" } = { activo: true }

        if (input.plataforma) {
            where.plataformaId = input.plataforma
        }

        if (input.tipo) {
            where.tipo = input.tipo
        }

        return Producto.findAndCountAll({
            where,
            include: [{
                model: Plataforma,
                required: true,
                where: { activo: true },
                attributes: ["id", "nombre", "logoUrl"]
            }],
            distinct: true,
            order: [["plataformaId", "ASC"], ["tipo", "ASC"], ["duracionDias", "ASC"], ["id", "ASC"]],
            limit: input.limit,
            offset: input.offset
        })
    }

    async findActivoById(id: number): Promise<Producto | null> {
        return Producto.findOne({
            where: { id, activo: true },
            include: [{
                model: Plataforma,
                required: true,
                where: { activo: true },
                attributes: ["id", "nombre", "logoUrl"]
            }]
        })
    }

    async stockCuentasPorPlataforma(plataformaIds: number[]): Promise<Map<number, number>> {
        if (plataformaIds.length === 0) {
            return new Map()
        }

        const rows = await sequelize.query<StockRow>(`
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
        `, {
            replacements: { plataformaIds },
            type: QueryTypes.SELECT
        })

        return new Map(rows.map((row) => [Number(row.plataformaId), Number(row.stock)]))
    }

    async stockPantallasPorPlataforma(plataformaIds: number[]): Promise<Map<number, number>> {
        if (plataformaIds.length === 0) {
            return new Map()
        }

        const rows = await sequelize.query<StockRow>(`
            SELECT c.plataformaId, COUNT(*) AS stock
            FROM cuentas c
            INNER JOIN pantallas p ON p.cuentaId = c.id
            WHERE c.plataformaId IN (:plataformaIds)
              AND c.estado IN ('disponible', 'parcial')
              AND p.estado = 'disponible'
            GROUP BY c.plataformaId
        `, {
            replacements: { plataformaIds },
            type: QueryTypes.SELECT
        })

        return new Map(rows.map((row) => [Number(row.plataformaId), Number(row.stock)]))
    }
}
