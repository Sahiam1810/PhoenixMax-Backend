import { Usuario } from "../models/Usuario.js"

interface CreateUsuarioInput {
    nombre: string
    email: string
    passwordHash: string
    telefono?: string
}

export class AuthRepository {
    async findByEmail(email: string): Promise<Usuario | null> {
        return Usuario.findOne({ where: { email } })
    }

    async findById(id: number): Promise<Usuario | null> {
        return Usuario.findByPk(id)
    }

    async create(input: CreateUsuarioInput): Promise<Usuario> {
        return Usuario.create({
            nombre: input.nombre,
            email: input.email,
            passwordHash: input.passwordHash,
            telefono: input.telefono ?? null,
            rol: "cliente"
        })
    }
}
