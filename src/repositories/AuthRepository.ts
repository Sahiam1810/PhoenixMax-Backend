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

    async update(id: number, input: { nombre?: string; telefono?: string | null }): Promise<Usuario | null> {
        const usuario = await Usuario.findByPk(id)
        if (!usuario) {
            return null
        }

        if (input.nombre !== undefined) {
            usuario.nombre = input.nombre
        }

        if (input.telefono !== undefined) {
            usuario.telefono = input.telefono?.trim() || null
        }

        await usuario.save()
        return usuario
    }
}
