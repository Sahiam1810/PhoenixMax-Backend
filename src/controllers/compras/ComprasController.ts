import type { Request, Response } from "express"
import { ComprasService } from "../../services/compras/ComprasService.js"
import { ApiResponse } from "../../utils/apiResponse.js"
const service = new ComprasService()
export class ComprasController { static create(_q: Request, r: Response): void { try { service.create() } catch (e) { ApiResponse.error(r, e) } } static pay(_q: Request, r: Response): void { try { service.pay() } catch (e) { ApiResponse.error(r, e) } } static mine(_q: Request, r: Response): void { try { service.mine() } catch (e) { ApiResponse.error(r, e) } } static detail(_q: Request, r: Response): void { try { service.detail() } catch (e) { ApiResponse.error(r, e) } } }
