import { UniqueConstraintError } from "sequelize"
import { AdminPlataformasRepository } from "../../../repositories/admin/plataformas/AdminPlataformasRepository.js"
import { HttpError } from "../../../utils/httpError.js"
import type { CreateAdminPlataformaInput, UpdateAdminPlataformaInput, UpdateAdminPlataformaEstadoInput } from "../../../validators/admin/plataformas/AdminPlataformasValidators.js"

export class AdminPlataformasService {
    constructor(private readonly plataformasRepository: AdminPlataformasRepository) {}

    async list() { return this.plataformasRepository.findAll() }

    async create(input: CreateAdminPlataformaInput) {
        await this.validarNombreUnico(input.nombre)
        try { return await this.plataformasRepository.create(input) } catch (error) { this.traducirConflicto(error) }
    }

    async update(id: number, input: UpdateAdminPlataformaInput) {
        const plataforma = await this.obtener(id)
        if (input.nombre) await this.validarNombreUnico(input.nombre, id)
        try { return await this.plataformasRepository.update(plataforma, input) } catch (error) { this.traducirConflicto(error) }
    }

    async cambiarEstado(id: number, input: UpdateAdminPlataformaEstadoInput) {
        return this.plataformasRepository.updateEstado(await this.obtener(id), input.activo)
    }

    private async obtener(id: number) {
        const plataforma = await this.plataformasRepository.findById(id)
        if (!plataforma) throw new HttpError("Plataforma no encontrada", 404)
        return plataforma
    }

    private async validarNombreUnico(nombre: string, excludedId?: number): Promise<void> {
        if (await this.plataformasRepository.findByNombre(nombre, excludedId)) throw new HttpError("Ya existe una plataforma con ese nombre", 409)
    }

    private traducirConflicto(error: unknown): never {
        if (error instanceof UniqueConstraintError) throw new HttpError("Ya existe una plataforma con ese nombre", 409)
        throw error
    }
}
