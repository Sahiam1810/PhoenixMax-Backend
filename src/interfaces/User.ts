export type UserRole = "admin" | "cliente"

export interface AuthUser {
    id: number
    email: string
    rol: UserRole
}

export interface TokenPayload extends AuthUser {
    iat?: number
    exp?: number
}

export interface UsuarioPublico {
    id: number
    nombre: string
    email: string
    telefono: string | null
    rol: UserRole
}

export interface LoginResult {
    token: string
    usuario: UsuarioPublico
}
