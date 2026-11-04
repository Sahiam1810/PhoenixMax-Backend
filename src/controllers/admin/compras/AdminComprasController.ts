import type { Request, Response } from "express"
import { AdminComprasService } from "../../../services/admin/compras/AdminComprasService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"
const service = new AdminComprasService()
export class AdminComprasController { static list(_q: Request, r: Response): void { try { service.list() } catch (e) { ApiResponse.error(r, e) } } }
