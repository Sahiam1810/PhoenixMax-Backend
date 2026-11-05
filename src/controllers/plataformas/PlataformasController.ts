import type { Request, Response } from "express"
import { PlataformasRepository } from "../../repositories/plataformas/PlataformasRepository.js"
import { PlataformasService } from "../../services/plataformas/PlataformasService.js"
import { ApiResponse } from "../../utils/apiResponse.js"

const service = new PlataformasService(new PlataformasRepository())

export class PlataformasController {
    static async list(_req: Request, res: Response): Promise<void> {
        try {
            const plataformas = await service.list()
            ApiResponse.success(res, plataformas, "Plataformas obtenidas")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }
}
