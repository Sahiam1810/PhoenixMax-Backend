import type { Request, Response } from "express"
import { ProductosService } from "../../services/productos/ProductosService.js"
import { ApiResponse } from "../../utils/apiResponse.js"
const service = new ProductosService()
export class ProductosController { static list(_req: Request, res: Response): void { try { service.list() } catch (error) { ApiResponse.error(res, error) } } static detail(_req: Request, res: Response): void { try { service.detail() } catch (error) { ApiResponse.error(res, error) } } }
