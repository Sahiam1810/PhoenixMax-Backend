import type { Request, Response } from "express"
import { AuthRepository } from "../repositories/AuthRepository.js"
import { AuthService } from "../services/AuthService.js"
import { ApiResponse } from "../utils/apiResponse.js"
import type { ActualizarPerfilInput, LoginInput, RegisterInput } from "../validators/AuthValidators.js"

const service = new AuthService(new AuthRepository())

export class AuthController {
    static async register(req: Request, res: Response): Promise<void> {
        try {
            const usuario = await service.register(req.body as RegisterInput)
            ApiResponse.created(res, usuario, "Usuario registrado")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async login(req: Request, res: Response): Promise<void> {
        try {
            const result = await service.login(req.body as LoginInput)
            ApiResponse.success(res, result, "Sesión iniciada")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async me(req: Request, res: Response): Promise<void> {
        try {
            const usuario = await service.me(req.user!.id)
            ApiResponse.success(res, usuario, "Usuario obtenido")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }

    static async actualizarPerfil(req: Request, res: Response): Promise<void> {
        try {
            const usuario = await service.actualizarPerfil(req.user!.id, req.body as ActualizarPerfilInput)
            ApiResponse.success(res, usuario, "Perfil actualizado")
        } catch (error) {
            ApiResponse.error(res, error)
        }
    }
}
