import type { Request, Response } from "express"
import { AdminCronService } from "../../../services/admin/cron/AdminCronService.js"
import { vencimientosService } from "../../../services/vencimientos/vencimientosServiceInstance.js"
import { ApiResponse } from "../../../utils/apiResponse.js"

const service = new AdminCronService(vencimientosService)

export class AdminCronController {
    static async run(_req: Request, res: Response): Promise<void> {
        try {
            const resultado = await service.run()
            ApiResponse.success(res, resultado, "Revisión de vencimientos ejecutada")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }
}
