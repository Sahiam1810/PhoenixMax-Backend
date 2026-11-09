import type { Request, Response } from "express"
import { AdminPlataformasRepository } from "../../../repositories/admin/plataformas/AdminPlataformasRepository.js"
import { AdminPlataformasService } from "../../../services/admin/plataformas/AdminPlataformasService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"
import type { IdParam } from "../../../validators/CommonValidators.js"
import type { CreateAdminPlataformaInput, UpdateAdminPlataformaInput, UpdateAdminPlataformaEstadoInput } from "../../../validators/admin/plataformas/AdminPlataformasValidators.js"

const service = new AdminPlataformasService(new AdminPlataformasRepository())

export class AdminPlataformasController {
    static async list(_req: Request, res: Response): Promise<void> {
        try { ApiResponse.success(res, await service.list(), "Plataformas obtenidas") } catch (error) { ApiResponse.error(res, error) }
    }

    static async create(req: Request, res: Response): Promise<void> {
        try { ApiResponse.created(res, await service.create(req.body as CreateAdminPlataformaInput), "Plataforma creada") } catch (error) { ApiResponse.error(res, error) }
    }

    static async update(req: Request, res: Response): Promise<void> {
        try {
            const { id } = res.locals.params as IdParam
            ApiResponse.success(res, await service.update(id, req.body as UpdateAdminPlataformaInput), "Plataforma actualizada")
        } catch (error) { ApiResponse.error(res, error) }
    }

    static async cambiarEstado(req: Request, res: Response): Promise<void> {
        try {
            const { id } = res.locals.params as IdParam
            const input = req.body as UpdateAdminPlataformaEstadoInput
            ApiResponse.success(res, await service.cambiarEstado(id, input), input.activo ? "Plataforma activada" : "Plataforma desactivada")
        } catch (error) { ApiResponse.error(res, error) }
    }
}
