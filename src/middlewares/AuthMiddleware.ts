import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config/config.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { z } from "../config/zod.js"

const tokenPayloadSchema = z.object({
    id: z.number().int().positive(),
    email: z.string(),
    rol: z.enum(["cliente", "admin"])
})

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authorization = req.header("Authorization")
    const parts = authorization?.split(" ")

    if (!parts || parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
        ApiResponse.unauthorized(res, "Token requerido")
        return
    }

    if (!config.jwt.secret) {
        ApiResponse.unauthorized(res, "Token inválido o vencido")
        return
    }

    try {
        const decodedPayload = jwt.verify(parts[1], config.jwt.secret)
        const result = tokenPayloadSchema.safeParse(decodedPayload)

        if (!result.success) {
            ApiResponse.unauthorized(res, "Token inválido o vencido")
            return
        }

        req.user = result.data
        next()
    } catch {
        ApiResponse.unauthorized(res, "Token inválido o vencido")
    }
}
