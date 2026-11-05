import type { Usuario } from "../models/Usuario.js"
import type { UsuarioPublico } from "../interfaces/User.js"

export const toMoney = (value: number): string => value.toFixed(2)

export const toUsuarioPublico = (usuario: Usuario): UsuarioPublico => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol
})
