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
