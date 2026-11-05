import { QueryTypes } from "sequelize"
import { sequelize } from "../../config/database.js"

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

export class StockRepository {
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
