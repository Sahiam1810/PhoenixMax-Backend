import type { Request, Response } from "express"
import { AdminProductosService } from "../../../services/admin/productos/AdminProductosService.js"
import { ApiResponse } from "../../../utils/apiResponse.js"
const service = new AdminProductosService()
export class AdminProductosController { static list(_q: Request, r: Response): void { try { service.list() } catch (e) { ApiResponse.error(r, e) } } static create(_q: Request, r: Response): void { try { service.create() } catch (e) { ApiResponse.error(r, e) } } static update(_q: Request, r: Response): void { try { service.update() } catch (e) { ApiResponse.error(r, e) } } static remove(_q: Request, r: Response): void { try { service.remove() } catch (e) { ApiResponse.error(r, e) } } }
