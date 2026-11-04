import type { Request, Response } from "express"
import { ApiResponse } from "../../utils/apiResponse.js"
import { PlataformasService } from "../../services/plataformas/PlataformasService.js"
const service = new PlataformasService()
export class PlataformasController { static list(_req: Request, res: Response): void { try { service.list() } catch (error) { ApiResponse.error(res, error) } } }
