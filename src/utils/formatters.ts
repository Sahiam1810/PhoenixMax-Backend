import type { Usuario } from "../models/Usuario.js"
import type { UsuarioPublico } from "../interfaces/User.js"
import type { PlataformaPublica, ProductoPublico } from "../interfaces/Catalogo.js"
import type { Plataforma } from "../models/Plataforma.js"
import type { Producto } from "../models/Producto.js"

export const toMoney = (value: number): string => value.toFixed(2)

export const toUsuarioPublico = (usuario: Usuario): UsuarioPublico => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol
})

export const toPlataformaPublica = (plataforma: Plataforma): PlataformaPublica => ({
    id: plataforma.id,
    nombre: plataforma.nombre,
    descripcion: plataforma.descripcion,
    logoUrl: plataforma.logoUrl,
    maxPantallas: plataforma.maxPantallas
})

export const toProductoPublico = (producto: Producto, stock: number): ProductoPublico => {
    if (!producto.plataforma) {
        throw new Error("La plataforma del producto no está disponible")
    }

    return {
        id: producto.id,
        plataformaId: producto.plataformaId,
        tipo: producto.tipo,
        duracionDias: producto.duracionDias,
        precio: Number(producto.precio).toFixed(2),
        stock,
        agotado: stock === 0,
        plataforma: {
            id: producto.plataforma.id,
            nombre: producto.plataforma.nombre,
            logoUrl: producto.plataforma.logoUrl
        }
    }
}
