import { DatabaseError, Transaction } from "sequelize"
import type { Sequelize } from "sequelize-typescript"
import type { CarritoItemPublico } from "../../interfaces/Carrito.js"
import type { TipoProducto } from "../../interfaces/Catalogo.js"
import type { CompraItemPublico, CompraPublica } from "../../interfaces/Compra.js"
import type { Compra } from "../../models/Compra.js"
import type { CompraItem } from "../../models/CompraItem.js"
import type { Producto } from "../../models/Producto.js"
import type { ServicioCreationAttributes } from "../../models/Servicio.js"
import { CarritoRepository } from "../../repositories/carrito/CarritoRepository.js"
import { ComprasRepository } from "../../repositories/compras/ComprasRepository.js"
import { AsignacionRepository } from "../../repositories/inventario/AsignacionRepository.js"
import { sumarDias } from "../../utils/fechas.js"
import { fromCentavos, toCentavos } from "../../utils/formatters.js"
import { HttpError } from "../../utils/httpError.js"
import { paginate, type PaginationResult } from "../../utils/pagination.js"
import type { ListComprasQuery, PayCompraInput } from "../../validators/compras/ComprasValidators.js"
import { CarritoService } from "../carrito/CarritoService.js"
import { planificarAsignacion, type PlanAsignacion, type UnidadPedida } from "./planificarAsignacion.js"

const ERRNO_DEADLOCK = 1213
const REINTENTOS_DEADLOCK = 2

interface ProductoDeItem {
    itemId: number
    plataformaId: number
    tipo: TipoProducto
    nombre: string
}

const nombreProducto = (plataforma: string, tipo: TipoProducto): string => `${plataforma} ${tipo}`

const listarNombres = (nombres: string[]): string => [...new Set(nombres)].join(", ")

const mensajeSinStock = (nombres: string[]): string => {
    const unicos = [...new Set(nombres)]
    const verbo = unicos.length > 1 ? "ya no tienen stock suficiente" : "ya no tiene stock suficiente"

    return `${listarNombres(unicos)} ${verbo}`
}

const mensajeNoDisponible = (nombres: string[]): string => {
    const unicos = [...new Set(nombres)]
    const verbo = unicos.length > 1 ? "ya no están disponibles" : "ya no está disponible"

    return `${listarNombres(unicos)} ${verbo}`
}

const conAjuste = (partes: string[]): string => `${partes.join(". ")}. Ajusta tu carrito.`

const esDeadlock = (error: unknown): boolean => {
    if (!(error instanceof DatabaseError)) {
        return false
    }

    const original: unknown = error.original

    if (typeof original !== "object" || original === null || !("errno" in original)) {
        return false
    }

    return original.errno === ERRNO_DEADLOCK
}

export class ComprasService {
    constructor(
        private readonly comprasRepository: ComprasRepository,
        private readonly asignacionRepository: AsignacionRepository,
        private readonly carritoService: CarritoService,
        private readonly carritoRepository: CarritoRepository,
        private readonly sequelize: Sequelize
    ) {}

    async create(usuarioId: number): Promise<CompraPublica> {
        const carrito = await this.carritoService.get(usuarioId)

        if (carrito.items.length === 0) {
            throw new HttpError("El carrito está vacío", 400)
        }

        this.validarCarrito(carrito.items)

        const compraId = await this.sequelize.transaction(async (transaction) => {
            await this.comprasRepository.cancelPendientesByUsuario(usuarioId, transaction)

            let totalCentavos = 0n
            const items = carrito.items.map((item) => {
                const precioCentavos = toCentavos(item.precioUnitario)
                const subtotalCentavos = precioCentavos * BigInt(item.cantidad)

                totalCentavos += subtotalCentavos

                return {
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                    precioUnitario: fromCentavos(precioCentavos),
                    subtotal: fromCentavos(subtotalCentavos)
                }
            })

            const compra = await this.comprasRepository.createCompra({
                usuarioId,
                total: fromCentavos(totalCentavos),
                estado: "pendiente"
            }, transaction)

            await this.comprasRepository.bulkCreateItems(items.map((item) => ({ ...item, compraId: compra.id })), transaction)

            return compra.id
        })

        return this.getById(usuarioId, compraId)
    }

    async pagar(usuarioId: number, compraId: number, input: PayCompraInput): Promise<CompraPublica> {
        let intento = 0

        while (true) {
            try {
                await this.pagarEnTransaccion(usuarioId, compraId, input)

                return this.getById(usuarioId, compraId)
            } catch (error) {
                if (error instanceof HttpError || !esDeadlock(error) || intento >= REINTENTOS_DEADLOCK) {
                    throw error
                }

                intento += 1
            }
        }
    }

    async list(usuarioId: number, query: ListComprasQuery): Promise<PaginationResult<CompraPublica>> {
        const offset = (query.page - 1) * query.limit
        const { rows, count } = await this.comprasRepository.findAndCountCompras({
            usuarioId,
            limit: query.limit,
            offset
        })
        const data = rows.map((compra) => this.toCompraPublica(compra))

        return paginate(data, query.page, query.limit, count)
    }

    async getById(usuarioId: number, id: number): Promise<CompraPublica> {
        const compra = await this.comprasRepository.findCompraDetalle(id, usuarioId)

        if (!compra) {
            throw new HttpError("Compra no encontrada", 404)
        }

        return this.toCompraPublica(compra)
    }

    private validarCarrito(items: CarritoItemPublico[]): void {
        const noDisponibles: string[] = []
        const sinStock: string[] = []

        for (const item of items) {
            const nombre = nombreProducto(item.producto.plataforma.nombre, item.producto.tipo)

            if (item.noDisponible) {
                noDisponibles.push(nombre)
                continue
            }

            if (item.agotado || item.excedeStock) {
                sinStock.push(nombre)
            }
        }

        const partes: string[] = []

        if (noDisponibles.length > 0) {
            partes.push(mensajeNoDisponible(noDisponibles))
        }

        if (sinStock.length > 0) {
            partes.push(mensajeSinStock(sinStock))
        }

        if (partes.length > 0) {
            throw new HttpError(conAjuste(partes), 409)
        }
    }

    private async pagarEnTransaccion(usuarioId: number, compraId: number, input: PayCompraInput): Promise<void> {
        await this.sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED }, async (transaction) => {
            const compra = await this.comprasRepository.findCompraParaPago(compraId, usuarioId, transaction)

            if (!compra) {
                throw new HttpError("Compra no encontrada", 404)
            }

            if (compra.estado === "pagada") {
                throw new HttpError("La compra ya fue pagada", 409)
            }

            if (compra.estado === "cancelada") {
                throw new HttpError("La compra fue cancelada. Vuelve a hacer el pedido desde tu carrito", 409)
            }

            const items = await this.comprasRepository.findItemsConProducto(compra.id, transaction)

            if (items.length === 0) {
                throw new HttpError("La compra no tiene productos", 400)
            }

            const productos = items.map((item) => this.productoDeItem(item))
            const faltantes = new Set<number>()
            const unidadesPorPlataforma = new Map<number, UnidadPedida[]>()

            for (const item of items) {
                const producto = this.obtenerProducto(item)
                const plataforma = this.obtenerPlataforma(producto)

                if (!producto.activo || !plataforma.activo) {
                    faltantes.add(item.id)
                    continue
                }

                const unidades = unidadesPorPlataforma.get(producto.plataformaId) ?? []

                for (let unidad = 0; unidad < item.cantidad; unidad += 1) {
                    unidades.push({ itemId: item.id, tipo: producto.tipo })
                }

                unidadesPorPlataforma.set(producto.plataformaId, unidades)
            }

            const plataformaIds = [...unidadesPorPlataforma.keys()].sort((a, b) => a - b)
            const planes: PlanAsignacion[] = []

            for (const plataformaId of plataformaIds) {
                const unidades = unidadesPorPlataforma.get(plataformaId) ?? []
                const cuentas = await this.asignacionRepository.lockCuentasByPlataforma(plataformaId, transaction)
                const cuentaIds = cuentas.map((cuenta) => cuenta.id)
                const pantallas = cuentaIds.length > 0
                    ? await this.asignacionRepository.lockPantallasByCuentas(cuentaIds, transaction)
                    : []
                const cuentasBloqueadas = cuentas.map((cuenta) => ({
                    id: cuenta.id,
                    estado: cuenta.estado,
                    pantallas: pantallas
                        .filter((pantalla) => pantalla.cuentaId === cuenta.id)
                        .map((pantalla) => ({ id: pantalla.id, estado: pantalla.estado }))
                }))
                const resultado = planificarAsignacion(cuentasBloqueadas, unidades)

                if (resultado.ok) {
                    planes.push(resultado.plan)
                    continue
                }

                for (const producto of productos) {
                    if (producto.plataformaId === plataformaId && resultado.faltante[producto.tipo] > 0) {
                        faltantes.add(producto.itemId)
                    }
                }
            }

            if (faltantes.size > 0) {
                const nombres = productos
                    .filter((producto) => faltantes.has(producto.itemId))
                    .map((producto) => producto.nombre)

                throw new HttpError(conAjuste([mensajeSinStock(nombres)]), 409)
            }

            const ahora = new Date()

            await this.aplicarPlanes(planes, items, usuarioId, ahora, transaction)
            await this.comprasRepository.updateCompraPagada(compra, { metodoPago: input.metodoPago, pagadaAt: ahora }, transaction)
            await this.carritoRepository.deleteByUsuario(usuarioId, transaction)
        })
    }

    private async aplicarPlanes(planes: PlanAsignacion[], items: CompraItem[], usuarioId: number, ahora: Date, transaction: Transaction): Promise<void> {
        const duracionPorItem = new Map(items.map((item) => [item.id, this.obtenerProducto(item).duracionDias]))
        const cuentasVendidas = planes.flatMap((plan) => plan.cuentasVendidas)
        const cuentasParciales = planes.flatMap((plan) => plan.cuentasParciales)
        const pantallasVendidas = planes.flatMap((plan) => plan.pantallasVendidas)

        if (cuentasVendidas.length > 0) {
            await this.asignacionRepository.updateCuentasEstado(cuentasVendidas, "vendida", transaction)
            await this.asignacionRepository.updatePantallasEstadoByCuentas(cuentasVendidas, "vendida", transaction)
        }

        if (pantallasVendidas.length > 0) {
            await this.asignacionRepository.updatePantallasEstado(pantallasVendidas, "vendida", transaction)
        }

        if (cuentasParciales.length > 0) {
            await this.asignacionRepository.updateCuentasEstado(cuentasParciales, "parcial", transaction)
        }

        const servicios: ServicioCreationAttributes[] = planes
            .flatMap((plan) => plan.asignaciones)
            .map((asignacion) => ({
                compraItemId: asignacion.itemId,
                usuarioId,
                cuentaId: asignacion.cuentaId,
                pantallaId: asignacion.pantallaId,
                fechaInicio: ahora,
                fechaVencimiento: sumarDias(ahora, duracionPorItem.get(asignacion.itemId) ?? 0),
                estado: "activo"
            }))

        await this.asignacionRepository.bulkCreateServicios(servicios, transaction)
    }

    private productoDeItem(item: CompraItem): ProductoDeItem {
        const producto = this.obtenerProducto(item)
        const plataforma = this.obtenerPlataforma(producto)

        return {
            itemId: item.id,
            plataformaId: producto.plataformaId,
            tipo: producto.tipo,
            nombre: nombreProducto(plataforma.nombre, producto.tipo)
        }
    }

    private obtenerProducto(item: CompraItem): Producto {
        if (!item.producto) {
            throw new Error("El ítem no tiene el producto cargado")
        }

        return item.producto
    }

    private obtenerPlataforma(producto: Producto): NonNullable<Producto["plataforma"]> {
        if (!producto.plataforma) {
            throw new Error("El producto no tiene la plataforma cargada")
        }

        return producto.plataforma
    }

    private toCompraPublica(compra: Compra): CompraPublica {
        const items = compra.compraItems ?? []

        return {
            id: compra.id,
            estado: compra.estado,
            total: fromCentavos(toCentavos(compra.total)),
            metodoPago: compra.metodoPago,
            pagadaAt: compra.pagadaAt ? compra.pagadaAt.toISOString() : null,
            createdAt: compra.createdAt.toISOString(),
            items: items.map((item) => this.toCompraItemPublico(item))
        }
    }

    private toCompraItemPublico(item: CompraItem): CompraItemPublico {
        const producto = this.obtenerProducto(item)
        const plataforma = this.obtenerPlataforma(producto)

        return {
            id: item.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: fromCentavos(toCentavos(item.precioUnitario)),
            subtotal: fromCentavos(toCentavos(item.subtotal)),
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
    }
}
