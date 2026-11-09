import { AdminProductosRepository } from "../../../repositories/admin/productos/AdminProductosRepository.js"
import { StockService } from "../../inventario/StockService.js"
import { toProductoPublico } from "../../../utils/formatters.js"
import { HttpError } from "../../../utils/httpError.js"
import type { CreateAdminProductoInput, UpdateAdminProductoInput, UpdateAdminProductoEstadoInput } from "../../../validators/admin/productos/AdminProductosValidators.js"

export class AdminProductosService {
    constructor(
        private readonly productosRepository: AdminProductosRepository,
        private readonly stockService: StockService
    ) {}

    async list() {
        const productos = await this.productosRepository.findAll()
        return this.conStock(productos)
    }

    async create(input: CreateAdminProductoInput) {
        await this.validarPlataforma(input.plataformaId)
        await this.validarDuplicado(input)
        const creado = await this.productosRepository.create(input)
        return this.conStockUno(creado.id)
    }

    async update(id: number, input: UpdateAdminProductoInput) {
        const producto = await this.obtener(id)
        const plataformaId = input.plataformaId ?? producto.plataformaId
        await this.validarPlataforma(plataformaId)
        await this.validarDuplicado({
            plataformaId,
            tipo: input.tipo ?? producto.tipo,
            duracionDias: input.duracionDias ?? producto.duracionDias
        }, id)
        await this.productosRepository.update(producto, input)
        return this.conStockUno(id)
    }

    async cambiarEstado(id: number, input: UpdateAdminProductoEstadoInput) {
        const producto = await this.productosRepository.updateEstado(await this.obtener(id), input.activo)
        return this.conStockUno(producto.id)
    }

    private async obtener(id: number) {
        const producto = await this.productosRepository.findById(id)
        if (!producto) throw new HttpError("Producto no encontrado", 404)
        return producto
    }

    private async validarPlataforma(id: number): Promise<void> {
        if (!await this.productosRepository.findPlataformaById(id)) throw new HttpError("Plataforma no encontrada", 404)
    }

    private async validarDuplicado(input: Pick<CreateAdminProductoInput, "plataformaId" | "tipo" | "duracionDias">, excludedId?: number): Promise<void> {
        if (await this.productosRepository.findDuplicate(input, excludedId)) throw new HttpError("Ya existe un producto con esa plataforma, tipo y duraciÃ³n", 409)
    }

    private async conStockUno(id: number) {
        const producto = await this.obtener(id)
        const [resultado] = await this.conStock([producto])
        return resultado
    }

    private async conStock(productos: Awaited<ReturnType<AdminProductosRepository["findAll"]>>) {
        const stock = await this.stockService.stockPorProducto(productos)
        return productos.map((producto) => ({
            ...toProductoPublico(producto, stock.get(producto.id) ?? 0),
            activo: producto.activo
        }))
    }
}
