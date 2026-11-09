import { Op } from "sequelize"
import { Producto } from "../../../models/Producto.js"
import { Plataforma } from "../../../models/Plataforma.js"
import type { CreateAdminProductoInput, UpdateAdminProductoInput } from "../../../validators/admin/productos/AdminProductosValidators.js"

export class AdminProductosRepository {
    async findAll(): Promise<Producto[]> { return Producto.findAll({ include: [{ model: Plataforma }], order: [["id", "ASC"]] }) }
    async findById(id: number): Promise<Producto | null> { return Producto.findByPk(id, { include: [{ model: Plataforma }] }) }
    async findPlataformaById(id: number): Promise<Plataforma | null> { return Plataforma.findByPk(id) }
    async findDuplicate(input: Pick<CreateAdminProductoInput, "plataformaId" | "tipo" | "duracionDias">, excludedId?: number): Promise<Producto | null> {
        return Producto.findOne({ where: { ...input, ...(excludedId ? { id: { [Op.ne]: excludedId } } : {}) } })
    }
    async create(input: CreateAdminProductoInput): Promise<Producto> { return Producto.create(input) }
    async update(producto: Producto, input: UpdateAdminProductoInput): Promise<Producto> { return producto.update(input) }
    async updateEstado(producto: Producto, activo: boolean): Promise<Producto> { return producto.update({ activo }) }
}
