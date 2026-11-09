import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { UniqueConstraintError } from "sequelize"
import { config } from "../config/config.js"
import type { AuthUser, LoginResult, UsuarioPublico } from "../interfaces/User.js"
import { AuthRepository } from "../repositories/AuthRepository.js"
import type { ActualizarPerfilInput, LoginInput, RegisterInput } from "../validators/AuthValidators.js"
import { toUsuarioPublico } from "../utils/formatters.js"
import { HttpError } from "../utils/httpError.js"

const PASSWORD_HASH_RELLENO = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

export class AuthService {
    constructor(private readonly authRepository: AuthRepository) {}

    async register(input: RegisterInput): Promise<UsuarioPublico> {
        const existingUser = await this.authRepository.findByEmail(input.email)

        if (existingUser) {
            throw new HttpError("El correo ya está registrado", 409)
        }

        const passwordHash = await bcrypt.hash(input.password, 10)

        try {
            const usuario = await this.authRepository.create({
                nombre: input.nombre,
                email: input.email,
                passwordHash,
                telefono: input.telefono
            })

            return toUsuarioPublico(usuario)
        } catch (error) {
            if (error instanceof UniqueConstraintError) {
                throw new HttpError("El correo ya está registrado", 409)
            }

            throw error
        }
    }

    async login(input: LoginInput): Promise<LoginResult> {
        const usuario = await this.authRepository.findByEmail(input.email)
        const passwordHash = usuario?.passwordHash ?? PASSWORD_HASH_RELLENO
        const passwordMatches = await bcrypt.compare(input.password, passwordHash)

        if (!usuario || !passwordMatches) {
            throw new HttpError("Credenciales incorrectas", 401)
        }

        if (!usuario.activo) {
            throw new HttpError("Usuario inactivo", 403)
        }

        if (!config.jwt.secret) {
            throw new Error("JWT_SECRET no configurado")
        }

        const payload: AuthUser = {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        }
        const token = jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"]
        })

        return {
            token,
            usuario: toUsuarioPublico(usuario)
        }
    }

    async me(userId: number): Promise<UsuarioPublico> {
        const usuario = await this.authRepository.findById(userId)

        if (!usuario) {
            throw new HttpError("Usuario no encontrado", 404)
        }

        return toUsuarioPublico(usuario)
    }

    async actualizarPerfil(userId: number, input: ActualizarPerfilInput): Promise<UsuarioPublico> {
        const usuario = await this.authRepository.update(userId, input)

        if (!usuario) {
            throw new HttpError("Usuario no encontrado", 404)
        }

        return toUsuarioPublico(usuario)
    }
}
