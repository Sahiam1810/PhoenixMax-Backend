import type { Request, Response } from "express"
import { sequelize } from "../../config/database.js"
import { CarritoRepository } from "../../repositories/carrito/CarritoRepository.js"
import { ComprasRepository } from "../../repositories/compras/ComprasRepository.js"
import { AsignacionRepository } from "../../repositories/inventario/AsignacionRepository.js"
import { StockRepository } from "../../repositories/inventario/StockRepository.js"
import { ProductosRepository } from "../../repositories/productos/ProductosRepository.js"
import { CarritoService } from "../../services/carrito/CarritoService.js"
import { ComprasService } from "../../services/compras/ComprasService.js"
import { StockService } from "../../services/inventario/StockService.js"
import { ApiResponse } from "../../utils/apiResponse.js"
import { enviarCorreo } from "../../utils/mailer.js"
import type { ListComprasQuery, PayCompraInput } from "../../validators/compras/ComprasValidators.js"

const carritoRepository = new CarritoRepository(new ProductosRepository())
const carritoService = new CarritoService(carritoRepository, new StockService(new StockRepository()), sequelize)
const service = new ComprasService(new ComprasRepository(), new AsignacionRepository(), carritoService, carritoRepository, sequelize, enviarCorreo)

export class ComprasController {
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const compra = await service.create(req.user!.id)
            ApiResponse.created(res, compra, "Compra creada")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async pagar(req: Request, res: Response): Promise<void> {
        try {
            const params = res.locals.params as { id: number }
            const compra = await service.pagar(req.user!.id, params.id, req.body as PayCompraInput)
            ApiResponse.success(res, compra, "Pago realizado correctamente")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async list(req: Request, res: Response): Promise<void> {
        try {
            const query = res.locals.query as ListComprasQuery
            const resultado = await service.list(req.user!.id, query)
            ApiResponse.success(res, resultado, "Compras obtenidas")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async getById(req: Request, res: Response): Promise<void> {
        try {
            const params = res.locals.params as { id: number }
            const compra = await service.getById(req.user!.id, params.id)
            ApiResponse.success(res, compra, "Compra obtenida")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }
}
