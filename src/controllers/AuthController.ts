import type { Request, Response } from "express"
import { AuthService } from "../services/AuthService.js"
import { ApiResponse } from "../utils/apiResponse.js"

const service = new AuthService()

export class AuthController {
    static register(_req: Request, res: Response): void { try { service.register() } catch (error) { ApiResponse.error(res, error) } }
    static login(_req: Request, res: Response): void { try { service.login() } catch (error) { ApiResponse.error(res, error) } }
    static me(_req: Request, res: Response): void { try { service.me() } catch (error) { ApiResponse.error(res, error) } }
}
