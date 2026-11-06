import { Op } from "sequelize"
import { Compra } from "../../../models/Compra.js"
import { Plataforma } from "../../../models/Plataforma.js"
import { Usuario } from "../../../models/Usuario.js"
import { StockRepository } from "../../../repositories/inventario/StockRepository.js"

export class AdminResumenService {
    private readonly stockRepository = new StockRepository()

    async get() {
        const ahora = new Date()
        const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
        const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999)
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999)

        // Compras pagadas hoy
        const comprasHoy = await Compra.findAll({
            where: {
                estado: "pagada",
                pagadaAt: { [Op.between]: [inicioHoy, finHoy] }
            }
        })
        const ventasHoy = comprasHoy.reduce((acc, c) => acc + Number(c.total), 0)

        // Compras pagadas este mes
        const comprasMes = await Compra.findAll({
            where: {
                estado: "pagada",
                pagadaAt: { [Op.between]: [inicioMes, finMes] }
            }
        })
        const ventasMes = comprasMes.reduce((acc, c) => acc + Number(c.total), 0)

        // Total clientes registrados
        const clientes = await Usuario.count({
            where: { rol: "cliente" }
        })

        // Plataformas y stock
        const plataformas = await Plataforma.findAll({
            order: [["id", "ASC"]]
        })
        const plataformaIds = plataformas.map((p) => p.id)

        const [stockCuentas, stockPantallas] = await Promise.all([
            this.stockRepository.stockCuentasPorPlataforma(plataformaIds),
            this.stockRepository.stockPantallasPorPlataforma(plataformaIds)
        ])

        const stock = plataformas.map((plataforma) => ({
            plataforma: {
                id: plataforma.id,
                nombre: plataforma.nombre,
                descripcion: plataforma.descripcion,
                logoUrl: plataforma.logoUrl,
                maxPantallas: plataforma.maxPantallas,
                activo: plataforma.activo
            },
            stockCuentas: stockCuentas.get(plataforma.id) ?? 0,
            stockPantallas: stockPantallas.get(plataforma.id) ?? 0
        }))

        return {
            ventasHoy,
            ventasMes,
            comprasHoy: comprasHoy.length,
            comprasMes: comprasMes.length,
            clientes,
            stock
        }
    }
}
