import { Op } from "sequelize"
import { Usuario } from "../../../models/Usuario.js"
import type { ListAdminUsuariosQuery } from "../../../validators/admin/usuarios/AdminUsuariosValidators.js"

export class AdminUsuariosRepository {
    async findAll(query: ListAdminUsuariosQuery): Promise<Usuario[]> {
        return Usuario.findAll({
            where: {
                ...(query.rol ? { rol: query.rol } : {}),
                ...(query.activo === undefined ? {} : { activo: query.activo }),
                ...(query.q ? { [Op.or]: [{ nombre: { [Op.like]: `%${query.q}%` } }, { email: { [Op.like]: `%${query.q}%` } }] } : {})
            },
            attributes: { exclude: ["passwordHash"] },
            order: [["createdAt", "DESC"], ["id", "DESC"]]
        })
    }

    async findById(id: number): Promise<Usuario | null> { return Usuario.findByPk(id) }
    async findByEmail(email: string): Promise<Usuario | null> { return Usuario.findOne({ where: { email } }) }
    async create(input: { nombre: string, email: string, telefono: string | null, passwordHash: string, rol: "cliente" | "admin" }): Promise<Usuario> { return Usuario.create({ ...input, activo: true }) }
    async updateEstado(usuario: Usuario, activo: boolean): Promise<Usuario> { return usuario.update({ activo }) }
}
