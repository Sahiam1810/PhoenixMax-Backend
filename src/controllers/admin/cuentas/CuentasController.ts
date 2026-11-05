import type { Request, Response } from "express"
import { sequelize } from "../../../config/database.js"
import { CuentasRepository } from "../../../repositories/admin/cuentas/CuentasRepository.js"
import { CuentasService } from "../../../services/admin/cuentas/CuentasService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"
import type { CreateCuentaInput, ListCuentasQuery } from "../../../validators/admin/cuentas/CuentasValidators.js"

const service = new CuentasService(new CuentasRepository(), sequelize)

export class CuentasController {
    static async list(_req: Request, res: Response): Promise<void> {
        try {
            const query = res.locals.query as ListCuentasQuery
            const resultado = await service.list(query)
            ApiResponse.success(res, resultado, "Cuentas obtenidas")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async create(req: Request, res: Response): Promise<void> {
        try {
            const cuenta = await service.create(req.body as CreateCuentaInput)
            ApiResponse.created(res, cuenta, "Cuenta creada")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }
}
