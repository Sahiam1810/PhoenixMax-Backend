import type { TipoProducto } from "../../interfaces/Catalogo.js"
import { StockRepository } from "../../repositories/inventario/StockRepository.js"

interface ProductoParaStock {
    id: number
    plataformaId: number
    tipo: TipoProducto
}

export class StockService {
    constructor(private readonly stockRepository: StockRepository) {}

    async stockPorProducto(productos: ProductoParaStock[]): Promise<Map<number, number>> {
        const plataformaIds = [...new Set(productos.map((producto) => producto.plataformaId))]
        const [stockCuentas, stockPantallas] = await Promise.all([
            this.stockRepository.stockCuentasPorPlataforma(plataformaIds),
            this.stockRepository.stockPantallasPorPlataforma(plataformaIds)
        ])
        const stock = new Map<number, number>()

        for (const producto of productos) {
            const stockPorTipo = producto.tipo === "cuenta" ? stockCuentas : stockPantallas
            stock.set(producto.id, stockPorTipo.get(producto.plataformaId) ?? 0)
        }

        return stock
    }
}
