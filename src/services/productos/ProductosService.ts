import type { ProductoPublico } from "../../interfaces/Catalogo.js"
import type { Producto } from "../../models/Producto.js"
import { ProductosRepository } from "../../repositories/productos/ProductosRepository.js"
import { toProductoPublico } from "../../utils/formatters.js"
import { HttpError } from "../../utils/httpError.js"
import { paginate, type PaginationResult } from "../../utils/pagination.js"
import type { ListProductosQuery } from "../../validators/productos/ProductosValidators.js"

interface StockPorTipo {
    cuenta: Map<number, number>
    pantalla: Map<number, number>
}

export class ProductosService {
    constructor(private readonly productosRepository: ProductosRepository) {}

    async list(query: ListProductosQuery): Promise<PaginationResult<ProductoPublico>> {
        const offset = (query.page - 1) * query.limit
        const { rows, count } = await this.productosRepository.findAndCountActivos({
            plataforma: query.plataforma,
            tipo: query.tipo,
            limit: query.limit,
            offset
        })
        const plataformaIds = [...new Set(rows.map((producto) => producto.plataformaId))]
        const stock = await this.obtenerStock(plataformaIds)
        const data = rows.map((producto) => this.toPublico(producto, stock))

        return paginate(data, query.page, query.limit, count)
    }

    async getById(id: number): Promise<ProductoPublico> {
        const producto = await this.productosRepository.findActivoById(id)

        if (!producto) {
            throw new HttpError("Producto no encontrado", 404)
        }

        const stock = await this.obtenerStock([producto.plataformaId])

        return this.toPublico(producto, stock)
    }

    private async obtenerStock(plataformaIds: number[]): Promise<StockPorTipo> {
        const [cuenta, pantalla] = await Promise.all([
            this.productosRepository.stockCuentasPorPlataforma(plataformaIds),
            this.productosRepository.stockPantallasPorPlataforma(plataformaIds)
        ])

        return { cuenta, pantalla }
    }

    private toPublico(producto: Producto, stock: StockPorTipo): ProductoPublico {
        const stockProducto = stock[producto.tipo].get(producto.plataformaId) ?? 0

        return toProductoPublico(producto, stockProducto)
    }
}
