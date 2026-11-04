import type { Request, Response } from "express"
import { ApiResponse } from "../utils/apiResponse.js"

export const notFoundMiddleware = (_req: Request, res: Response): void => { ApiResponse.notFound(res, "Ruta no encontrada") }
