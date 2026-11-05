import type { Request, Response } from "express"
import { ProductosRepository } from "../../repositories/productos/ProductosRepository.js"
import { StockRepository } from "../../repositories/inventario/StockRepository.js"
import { StockService } from "../../services/inventario/StockService.js"
import { ProductosService } from "../../services/productos/ProductosService.js"
import { ApiResponse } from "../../utils/apiResponse.js"
import type { ListProductosQuery } from "../../validators/productos/ProductosValidators.js"

const service = new ProductosService(new ProductosRepository(), new StockService(new StockRepository()))

export class ProductosController {
    static async list(_req: Request, res: Response): Promise<void> {
        try {
            const query = res.locals.query as ListProductosQuery
            const resultado = await service.list(query)
            ApiResponse.success(res, resultado, "Productos obtenidos")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async getById(_req: Request, res: Response): Promise<void> {
        try {
            const params = res.locals.params as { id: number }
            const producto = await service.getById(params.id)
            ApiResponse.success(res, producto, "Producto obtenido")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }
}
