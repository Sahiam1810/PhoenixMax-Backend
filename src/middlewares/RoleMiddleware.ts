import type { NextFunction, Request, Response } from "express"
import type { UserRole } from "../interfaces/User.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { HttpError } from "../utils/httpError.js"

export const requireRole = (role: UserRole) => (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.rol !== role) {
        ApiResponse.error(res, new HttpError("No tienes permisos para esta acción", 403))
        return
    }
    next()
}
