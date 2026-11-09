import type { Request, Response } from "express"
import { AdminUsuariosRepository } from "../../../repositories/admin/usuarios/AdminUsuariosRepository.js"
import { AdminUsuariosService } from "../../../services/admin/usuarios/AdminUsuariosService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"
import type { IdParam } from "../../../validators/CommonValidators.js"
import type { CreateAdminUsuarioInput, ListAdminUsuariosQuery, UpdateAdminUsuarioEstadoInput } from "../../../validators/admin/usuarios/AdminUsuariosValidators.js"

const service = new AdminUsuariosService(new AdminUsuariosRepository())

export class AdminUsuariosController {
    static async list(_req: Request, res: Response): Promise<void> {
        try { ApiResponse.success(res, await service.list(res.locals.query as ListAdminUsuariosQuery), "Usuarios obtenidos") } catch (error) { ApiResponse.error(res, error) }
    }

    static async create(req: Request, res: Response): Promise<void> {
        try { ApiResponse.created(res, await service.create(req.body as CreateAdminUsuarioInput), "Usuario creado") } catch (error) { ApiResponse.error(res, error) }
    }

    static async cambiarEstado(req: Request, res: Response): Promise<void> {
        try {
            const { id } = res.locals.params as IdParam
            const usuario = await service.cambiarEstado(id, req.body as UpdateAdminUsuarioEstadoInput, req.user!.id)
            ApiResponse.success(res, usuario, usuario.activo ? "Usuario activado" : "Usuario desactivado")
        } catch (error) { ApiResponse.error(res, error) }
    }
}
