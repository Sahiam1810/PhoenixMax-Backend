import type { Request, Response } from "express"
import { ServiciosRepository } from "../../repositories/servicios/ServiciosRepository.js"
import { ServiciosService } from "../../services/servicios/ServiciosService.js"
import { ApiResponse } from "../../utils/apiResponse.js"

const service = new ServiciosService(new ServiciosRepository())

export class ServiciosController {
    static async list(req: Request, res: Response): Promise<void> {
        try {
            res.setHeader("Cache-Control", "no-store")
            const servicios = await service.list(req.user!.id)
            ApiResponse.success(res, servicios, "Servicios obtenidos")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }
}
