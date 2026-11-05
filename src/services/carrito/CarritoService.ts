import { Transaction, UniqueConstraintError } from "sequelize"
import type { Sequelize } from "sequelize-typescript"
import type { CarritoPublico } from "../../interfaces/Carrito.js"
import type { CarritoItem } from "../../models/CarritoItem.js"
import type { Producto } from "../../models/Producto.js"
import { CarritoRepository } from "../../repositories/carrito/CarritoRepository.js"
import { fromCentavos, toCentavos } from "../../utils/formatters.js"
import { HttpError } from "../../utils/httpError.js"
import type { AddCarritoItemInput, UpdateCarritoItemInput } from "../../validators/carrito/CarritoValidators.js"
import { StockService } from "../inventario/StockService.js"

export class CarritoService {
    constructor(
        private readonly carritoRepository: CarritoRepository,
        private readonly stockService: StockService,
        private readonly sequelize: Sequelize
    ) {}

    async get(usuarioId: number): Promise<CarritoPublico> {
        const items = await this.carritoRepository.findByUsuario(usuarioId)
        const productos = items.map((item) => this.obtenerProducto(item))
        const stockPorProducto = await this.stockService.stockPorProducto(productos)
        let totalCentavos = 0n
        let totalItems = 0

        const itemsPublicos = items.map((item) => {
            const producto = this.obtenerProducto(item)
            const plataforma = producto.plataforma

            if (!plataforma) {
                throw new Error("El producto no tiene la plataforma cargada")
            }

            const noDisponible = !producto.activo || !plataforma.activo
            const stock = noDisponible ? 0 : stockPorProducto.get(producto.id) ?? 0
            const agotado = stock === 0
            const excedeStock = item.cantidad > stock && stock > 0
            const precioUnitarioCentavos = toCentavos(producto.precio)
            const subtotalCentavos = precioUnitarioCentavos * BigInt(item.cantidad)

            totalItems += item.cantidad

            if (!noDisponible && !agotado) {
                totalCentavos += subtotalCentavos
            }

            return {
                id: item.id,
                productoId: item.productoId,
                cantidad: item.cantidad,
                precioUnitario: fromCentavos(precioUnitarioCentavos),
                subtotal: fromCentavos(subtotalCentavos),
                stock,
                agotado,
                excedeStock,
                noDisponible,
                producto: {
                    tipo: producto.tipo,
                    duracionDias: producto.duracionDias,
                    plataforma: {
                        id: plataforma.id,
                        nombre: plataforma.nombre,
                        logoUrl: plataforma.logoUrl
                    }
                }
            }
        })

        return {
            items: itemsPublicos,
            totalItems,
            total: fromCentavos(totalCentavos)
        }
    }

    async add(usuarioId: number, input: AddCarritoItemInput): Promise<CarritoPublico> {
        const producto = await this.carritoRepository.findProductoActivo(input.productoId)

        if (!producto) {
            throw new HttpError("Producto no encontrado", 404)
        }

        const stock = await this.obtenerStockProducto(producto)

        if (stock === 0) {
            throw new HttpError("El producto está agotado", 400)
        }

        try {
            await this.agregarEnTransaccion(usuarioId, input, stock)
        } catch (error) {
            if (!(error instanceof UniqueConstraintError)) {
                throw error
            }

            await this.agregarEnTransaccion(usuarioId, input, stock)
        }

        return this.get(usuarioId)
    }

    async updateCantidad(usuarioId: number, itemId: number, input: UpdateCarritoItemInput): Promise<CarritoPublico> {
        const item = await this.carritoRepository.findItem(itemId, usuarioId)

        if (!item) {
            throw new HttpError("Ítem no encontrado", 404)
        }

        const producto = await this.carritoRepository.findProductoActivo(item.productoId)

        if (!producto) {
            throw new HttpError("El producto ya no está disponible", 400)
        }

        const stock = await this.obtenerStockProducto(producto)

        if (input.cantidad > stock) {
            throw new HttpError(`Solo hay ${stock} unidades disponibles`, 400)
        }

        await this.carritoRepository.updateCantidad(item, input.cantidad)

        return this.get(usuarioId)
    }

    async removeItem(usuarioId: number, itemId: number): Promise<CarritoPublico> {
        const item = await this.carritoRepository.findItem(itemId, usuarioId)

        if (!item) {
            throw new HttpError("Ítem no encontrado", 404)
        }

        await this.carritoRepository.deleteItem(item)

        return this.get(usuarioId)
    }

    async clear(usuarioId: number): Promise<CarritoPublico> {
        await this.carritoRepository.deleteByUsuario(usuarioId)

        return {
            items: [],
            totalItems: 0,
            total: "0.00"
        }
    }

    private async agregarEnTransaccion(usuarioId: number, input: AddCarritoItemInput, stock: number): Promise<void> {
        await this.sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED }, async (transaction) => {
            const existente = await this.carritoRepository.findItemByProducto(usuarioId, input.productoId, transaction)
            const cantidadTotal = (existente?.cantidad ?? 0) + input.cantidad

            if (cantidadTotal > stock) {
                const mensaje = existente
                    ? `Solo hay ${stock} unidades disponibles y ya tienes ${existente.cantidad} en el carrito`
                    : `Solo hay ${stock} unidades disponibles`
                throw new HttpError(mensaje, 400)
            }

            if (existente) {
                await this.carritoRepository.updateCantidad(existente, cantidadTotal, transaction)
                return
            }

            await this.carritoRepository.create({
                usuarioId,
                productoId: input.productoId,
                cantidad: input.cantidad
            }, transaction)
        })
    }

    private async obtenerStockProducto(producto: Producto): Promise<number> {
        const stock = await this.stockService.stockPorProducto([producto])

        return stock.get(producto.id) ?? 0
    }

    private obtenerProducto(item: CarritoItem): Producto {
        if (!item.producto) {
            throw new Error("El ítem no tiene el producto cargado")
        }

        return item.producto
    }
}
