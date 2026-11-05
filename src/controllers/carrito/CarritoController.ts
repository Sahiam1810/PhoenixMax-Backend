import type { Request, Response } from "express"
import { sequelize } from "../../config/database.js"
import { StockRepository } from "../../repositories/inventario/StockRepository.js"
import { CarritoRepository } from "../../repositories/carrito/CarritoRepository.js"
import { ProductosRepository } from "../../repositories/productos/ProductosRepository.js"
import { CarritoService } from "../../services/carrito/CarritoService.js"
import { StockService } from "../../services/inventario/StockService.js"
import { ApiResponse } from "../../utils/apiResponse.js"
import type { AddCarritoItemInput, CarritoItemIdParams, UpdateCarritoItemInput } from "../../validators/carrito/CarritoValidators.js"

const service = new CarritoService(
    new CarritoRepository(new ProductosRepository()),
    new StockService(new StockRepository()),
    sequelize
)

export class CarritoController {
    static async get(req: Request, res: Response): Promise<void> {
        try {
            const carrito = await service.get(req.user!.id)
            ApiResponse.success(res, carrito, "Carrito obtenido")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async add(req: Request, res: Response): Promise<void> {
        try {
            const carrito = await service.add(req.user!.id, req.body as AddCarritoItemInput)
            ApiResponse.created(res, carrito, "Producto agregado al carrito")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async updateCantidad(req: Request, res: Response): Promise<void> {
        try {
            const params = res.locals.params as CarritoItemIdParams
            const carrito = await service.updateCantidad(req.user!.id, params.itemId, req.body as UpdateCarritoItemInput)
            ApiResponse.success(res, carrito, "Cantidad actualizada")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async removeItem(req: Request, res: Response): Promise<void> {
        try {
            const params = res.locals.params as CarritoItemIdParams
            const carrito = await service.removeItem(req.user!.id, params.itemId)
            ApiResponse.success(res, carrito, "Producto eliminado del carrito")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async clear(req: Request, res: Response): Promise<void> {
        try {
            const carrito = await service.clear(req.user!.id)
            ApiResponse.success(res, carrito, "Carrito vaciado")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }
}
