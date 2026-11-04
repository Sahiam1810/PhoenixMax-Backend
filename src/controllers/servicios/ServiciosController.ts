import type { Request, Response } from "express"
import { ServiciosService } from "../../services/servicios/ServiciosService.js"
import { ApiResponse } from "../../utils/apiResponse.js"
const service = new ServiciosService()
export class ServiciosController { static mine(_q: Request, r: Response): void { try { service.mine() } catch (e) { ApiResponse.error(r, e) } } }
