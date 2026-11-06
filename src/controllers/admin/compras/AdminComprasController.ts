import type { Request, Response } from "express"
import { AdminComprasService } from "../../../services/admin/compras/AdminComprasService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"

const service = new AdminComprasService()

export class AdminComprasController {
    static async list(req: Request, res: Response): Promise<void> {
        try {
            const data = await service.list(req.query as { estado?: string, desde?: string, hasta?: string })
            ApiResponse.success(res, data, "Compras obtenidas")
        } catch (e) {
            ApiResponse.error(res, e)
        }
    }
}
