import { Op } from "sequelize"
import { Plataforma } from "../../../models/Plataforma.js"
import type { CreateAdminPlataformaInput, UpdateAdminPlataformaInput } from "../../../validators/admin/plataformas/AdminPlataformasValidators.js"

export class AdminPlataformasRepository {
    async findAll(): Promise<Plataforma[]> { return Plataforma.findAll({ order: [["id", "ASC"]] }) }
    async findById(id: number): Promise<Plataforma | null> { return Plataforma.findByPk(id) }
    async findByNombre(nombre: string, excludedId?: number): Promise<Plataforma | null> {
        return Plataforma.findOne({ where: { nombre, ...(excludedId ? { id: { [Op.ne]: excludedId } } : {}) } })
    }
    async create(input: CreateAdminPlataformaInput): Promise<Plataforma> { return Plataforma.create(input) }
    async update(plataforma: Plataforma, input: UpdateAdminPlataformaInput): Promise<Plataforma> { return plataforma.update(input) }
    async updateEstado(plataforma: Plataforma, activo: boolean): Promise<Plataforma> { return plataforma.update({ activo }) }
}
