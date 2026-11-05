import type { Request, Response } from "express"
import { CuentasService } from "../../../services/admin/cuentas/CuentasService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"

const service = new CuentasService()

export class CuentasController { static list(_q: Request, r: Response): void { try { service.list() } catch (e) { ApiResponse.error(r, e) } } static create(_q: Request, r: Response): void { try { service.create() } catch (e) { ApiResponse.error(r, e) } } }
