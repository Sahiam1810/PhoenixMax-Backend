import type { Request, Response } from "express"
import { AdminResumenService } from "../../../services/admin/resumen/AdminResumenService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"

const service = new AdminResumenService()

export class AdminResumenController {
    static async get(_req: Request, res: Response): Promise<void> {
        try {
            const data = await service.get()
            ApiResponse.success(res, data, "Resumen obtenido")
        } catch (e) {
            ApiResponse.error(res, e)
        }
    }
}
