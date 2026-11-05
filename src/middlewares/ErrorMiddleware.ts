import type { NextFunction, Request, Response } from "express"
import { ApiResponse } from "../utils/apiResponse.js"
import { logger } from "../utils/logger.js"

export const errorMiddleware = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (error instanceof SyntaxError) {
        res.status(400).json({ error: "JSON inválido" })
        return
    }

    logger.error(error instanceof Error ? error.message : "Error no identificado")
    ApiResponse.error(res, error)
}
