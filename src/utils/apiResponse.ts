import type { Response } from "express"
import { HttpError } from "./httpError.js"

export class ApiResponse {
    static success<T>(res: Response, data: T, message = "Operación exitosa"): Response {
        return res.status(200).json({ message, data })
    }

    static created<T>(res: Response, data: T, message = "Recurso creado"): Response {
        return res.status(201).json({ message, data })
    }

    static error(res: Response, error: unknown): Response {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({ error: error.message })
        }
        return res.status(500).json({ error: "Error interno del servidor" })
    }

    static notFound(res: Response, message = "Recurso no encontrado"): Response {
        return res.status(404).json({ error: message })
    }

    static unauthorized(res: Response, message = "No autorizado"): Response {
        return res.status(401).json({ error: message })
    }
}
