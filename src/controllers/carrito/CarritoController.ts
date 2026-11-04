import type { Request, Response } from "express"
import { CarritoService } from "../../services/carrito/CarritoService.js"
import { ApiResponse } from "../../utils/apiResponse.js"
const service = new CarritoService()
export class CarritoController { static get(_q: Request, r: Response): void { try { service.get() } catch (e) { ApiResponse.error(r, e) } } static add(_q: Request, r: Response): void { try { service.add() } catch (e) { ApiResponse.error(r, e) } } static update(_q: Request, r: Response): void { try { service.update() } catch (e) { ApiResponse.error(r, e) } } static remove(_q: Request, r: Response): void { try { service.remove() } catch (e) { ApiResponse.error(r, e) } } static clear(_q: Request, r: Response): void { try { service.clear() } catch (e) { ApiResponse.error(r, e) } } }
