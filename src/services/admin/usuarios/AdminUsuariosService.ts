import bcrypt from "bcrypt"
import { UniqueConstraintError } from "sequelize"
import type { UsuarioPublico } from "../../../interfaces/User.js"
import { AdminUsuariosRepository } from "../../../repositories/admin/usuarios/AdminUsuariosRepository.js"
import { toUsuarioPublico } from "../../../utils/formatters.js"
import { HttpError } from "../../../utils/httpError.js"
import type { CreateAdminUsuarioInput, ListAdminUsuariosQuery, UpdateAdminUsuarioEstadoInput } from "../../../validators/admin/usuarios/AdminUsuariosValidators.js"

export class AdminUsuariosService {
    constructor(private readonly usuariosRepository: AdminUsuariosRepository) {}

    async list(query: ListAdminUsuariosQuery): Promise<UsuarioPublico[]> {
        return (await this.usuariosRepository.findAll(query)).map(toUsuarioPublico)
    }

    async create(input: CreateAdminUsuarioInput): Promise<UsuarioPublico> {
        if (await this.usuariosRepository.findByEmail(input.email)) throw new HttpError("El correo ya está registrado", 409)
        try {
            const usuario = await this.usuariosRepository.create({ ...input, telefono: input.telefono || null, passwordHash: await bcrypt.hash(input.password, 10) })
            return toUsuarioPublico(usuario)
        } catch (error) {
            if (error instanceof UniqueConstraintError) throw new HttpError("El correo ya está registrado", 409)
            throw error
        }
    }

    async cambiarEstado(id: number, input: UpdateAdminUsuarioEstadoInput, adminId: number): Promise<UsuarioPublico> {
        if (id === adminId && !input.activo) throw new HttpError("No puedes desactivar tu propio usuario", 409)
        const usuario = await this.usuariosRepository.findById(id)
        if (!usuario) throw new HttpError("Usuario no encontrado", 404)
        return toUsuarioPublico(await this.usuariosRepository.updateEstado(usuario, input.activo))
    }
}
