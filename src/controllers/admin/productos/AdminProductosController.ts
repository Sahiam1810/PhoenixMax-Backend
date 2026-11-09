import type { Request, Response } from "express"
import { AdminProductosRepository } from "../../../repositories/admin/productos/AdminProductosRepository.js"
import { AdminProductosService } from "../../../services/admin/productos/AdminProductosService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"
import type { IdParam } from "../../../validators/CommonValidators.js"
import type { CreateAdminProductoInput, UpdateAdminProductoInput, UpdateAdminProductoEstadoInput } from "../../../validators/admin/productos/AdminProductosValidators.js"

const service = new AdminProductosService(new AdminProductosRepository())

export class AdminProductosController {
    static async list(_req: Request, res: Response): Promise<void> {
        try { ApiResponse.success(res, await service.list(), "Productos obtenidos") } catch (error) { ApiResponse.error(res, error) }
    }

    static async create(req: Request, res: Response): Promise<void> {
        try { ApiResponse.created(res, await service.create(req.body as CreateAdminProductoInput), "Producto creado") } catch (error) { ApiResponse.error(res, error) }
    }

    static async update(req: Request, res: Response): Promise<void> {
        try {
            const { id } = res.locals.params as IdParam
            ApiResponse.success(res, await service.update(id, req.body as UpdateAdminProductoInput), "Producto actualizado")
        } catch (error) { ApiResponse.error(res, error) }
    }

    static async cambiarEstado(req: Request, res: Response): Promise<void> {
        try {
            const { id } = res.locals.params as IdParam
            const input = req.body as UpdateAdminProductoEstadoInput
            ApiResponse.success(res, await service.cambiarEstado(id, input), input.activo ? "Producto activado" : "Producto desactivado")
        } catch (error) { ApiResponse.error(res, error) }
    }
}
