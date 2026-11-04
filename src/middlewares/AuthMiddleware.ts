import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config/config.js"
import type { TokenPayload } from "../interfaces/User.js"
import { ApiResponse } from "../utils/apiResponse.js"

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies.accessToken as string | undefined ?? req.header("Authorization")?.replace("Bearer ", "")
    if (!token || !config.jwt.secret) {
        ApiResponse.unauthorized(res)
        return
    }
    try {
        const payload = jwt.verify(token, config.jwt.secret) as TokenPayload
        req.user = { id: payload.id, email: payload.email, rol: payload.rol }
        next()
    } catch {
        ApiResponse.unauthorized(res, "Token inválido o vencido")
    }
}
