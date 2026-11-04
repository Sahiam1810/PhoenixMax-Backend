import type { Request, Response } from "express"
import { AdminResumenService } from "../../../services/admin/resumen/AdminResumenService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"
const service = new AdminResumenService()
export class AdminResumenController { static get(_q: Request, r: Response): void { try { service.get() } catch (e) { ApiResponse.error(r, e) } } }
