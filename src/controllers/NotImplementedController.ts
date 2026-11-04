import type { Request, Response } from "express"
import { ApiResponse } from "../utils/apiResponse.js"
import { NotImplementedService } from "../services/NotImplementedService.js"

const service = new NotImplementedService()

export const notImplemented = (_req: Request, res: Response): void => {
    try {
        service["unavailable"]()
    } catch (error) {
        ApiResponse.error(res, error)
    }
}
