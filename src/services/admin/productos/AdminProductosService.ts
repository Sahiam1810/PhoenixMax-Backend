import { AdminProductosRepository } from "../../../repositories/admin/productos/AdminProductosRepository.js"
import { HttpError } from "../../../utils/httpError.js"
import type { CreateAdminProductoInput, UpdateAdminProductoInput, UpdateAdminProductoEstadoInput } from "../../../validators/admin/productos/AdminProductosValidators.js"

export class AdminProductosService {
    constructor(private readonly productosRepository: AdminProductosRepository) {}

    async list() { return this.productosRepository.findAll() }

    async create(input: CreateAdminProductoInput) {
        await this.validarPlataforma(input.plataformaId)
        await this.validarDuplicado(input)
        const creado = await this.productosRepository.create(input)
        return this.productosRepository.findById(creado.id)
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
        return this.productosRepository.findById(id)
    }

    async cambiarEstado(id: number, input: UpdateAdminProductoEstadoInput) {
        const producto = await this.productosRepository.updateEstado(await this.obtener(id), input.activo)
        return this.productosRepository.findById(producto.id)
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
}
